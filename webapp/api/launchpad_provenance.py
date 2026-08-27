import os
import re
from concurrent.futures import ThreadPoolExecutor

from webapp.api.exceptions import ApiTimeoutError
from webapp.api.requests import Session

MAX_CONCURRENT_SCANS = 10

LAUNCHPAD_API_URL = os.getenv(
    "LAUNCHPAD_API_URL", "https://api.launchpad.net/devel/"
)


GITHUB_URL_RE = re.compile(
    r"^(?:https?://)?(?:www\.)?github\.com/"
    r"(?P<repo>[^/]+/[^/]+?)(?:\.git)?/?$"
)

LAUNCHPAD_GIT_RE = re.compile(
    r"^https?://api\.launchpad\.net/[^/]+/"
    r"(?P<path>~[^/]+/(?:[^/]+/)*\+git/[^/]+?)/?$"
)


def failure_reason(exc):
    if isinstance(exc, ApiTimeoutError):
        return "launchpad_timeout"
    return "launchpad_error"


def extract_github_repository(git_repository_url):
    """Extract owner/repo from a GitHub repository URL, or None.

    Anchored at both ends: the badge attests against this, so a URL merely
    containing "github.com/" must not match.
    """
    if not git_repository_url:
        return None

    match = GITHUB_URL_RE.match(git_repository_url)
    if match:
        return match.groupdict()["repo"]
    return None


def extract_launchpad_repository(git_repository_link):
    """Extract the git.launchpad.net path from a Launchpad link"""
    if not git_repository_link:
        return None

    match = LAUNCHPAD_GIT_RE.match(git_repository_link)
    if match:
        return match.groupdict()["path"]
    return None


def build_commit_url(source, commit_sha):
    """Build a browsable commit URL for a recipe's source"""
    if source.get("github_repository"):
        return (
            f"https://github.com/{source['github_repository']}"
            f"/commit/{commit_sha}"
        )
    if source.get("launchpad_repository"):
        return (
            f"https://git.launchpad.net/{source['launchpad_repository']}"
            f"/commit/?id={commit_sha}"
        )
    return None


def recipe_source(recipe):
    """Resolve where a recipe's source is hosted."""
    git_repository_url = recipe.get("git_repository_url")
    return {
        "git_repository_url": git_repository_url,
        "github_repository": extract_github_repository(git_repository_url),
        "launchpad_repository": extract_launchpad_repository(
            recipe.get("git_repository_link")
        ),
    }


class LaunchpadProvenance:
    """Read-only, anonymous client for Launchpad build provenance.

    Unlike the authenticated ``canonicalwebteam.launchpad`` client, this one
    sends no OAuth credentials and does not filter recipes by owner, so it can
    read provenance for *any* public Launchpad recipe. It is used to link a
    store revision back to the public git commit it was built from.
    """

    def __init__(self, session=None, api_url=LAUNCHPAD_API_URL):
        self.api_url = api_url
        self._owns_session = session is None
        self.session = session or Session()
        self.session.headers["Accept"] = "application/json"

    def _get(self, url, params=None, session=None):
        response = (session or self.session).get(url, params=params)
        response.raise_for_status()
        return response.json()

    def _new_session(self):
        if not self._owns_session:
            return self.session
        session = Session()
        session.headers["Accept"] = "application/json"
        return session

    def get_recipes(self, store_name, max_recipes):
        """Find the public Launchpad recipes for a store name, best first.

        store_name is free text, so one name matches dozens of recipes
        (firefox matches 62), mostly personal ones that never upload. Ranked
        by upload capability, then recency; at most ``max_recipes``.
        """
        data = self._get(
            f"{self.api_url}+snaps",
            params={
                "ws.op": "findByStoreName",
                "store_name": f'"{store_name}"',
            },
        )

        matches = [
            entry
            for entry in data.get("entries", [])
            if entry.get("store_name") == store_name
        ]

        # Two stable sorts: the second keeps the date order within each group.
        matches.sort(
            key=lambda e: e.get("date_last_modified") or "", reverse=True
        )
        matches.sort(key=lambda e: not e.get("can_upload_to_store"))

        return matches[:max_recipes]

    def iter_builds(self, collection_link, max_pages, session=None):
        """Collect completed builds"""
        entries = []
        url = collection_link
        pages = 0

        while url and pages < max_pages:
            try:
                data = self._get(url, session=session)
            except Exception as exc:
                return entries, failure_reason(exc)
            entries.extend(data.get("entries", []))
            url = data.get("next_collection_link")
            pages += 1

        return entries, None

    def _scan_recipe(self, recipe, max_pages):
        return self.iter_builds(
            recipe["completed_builds_collection_link"],
            max_pages,
            session=self._new_session(),
        )

    def _merge_builds(self, builds, source, revisions):
        """Fold one recipe's builds into the shared revision map.

        Returns True if anything was added; earlier recipes win on conflict.
        """
        added = False

        for build in builds:
            if build.get("store_upload_status") != "Uploaded":
                continue

            revision = build.get("store_upload_revision")
            commit_sha = build.get("revision_id")
            arch = build.get("arch_tag")

            if not revision or not commit_sha or not arch:
                continue

            revision_key = str(revision)
            # Newest first, so the first build seen for a revision+arch wins.
            arch_map = revisions.setdefault(revision_key, {})
            if arch in arch_map:
                continue

            commit_url = build_commit_url(source, commit_sha)

            build_id = None
            build_url = None
            self_link = build.get("self_link")
            if self_link:
                build_id = self_link.rstrip("/").split("/")[-1]
                # API self_link -> human-facing web URL.
                build_url = self_link.replace(
                    "api.launchpad.net/devel/", "launchpad.net/"
                )

            arch_map[arch] = {
                "commit_sha": commit_sha,
                "commit_url": commit_url,
                "build_id": build_id,
                "build_url": build_url,
                # Per entry: a merged map can span recipes with different
                # sources.
                "github_repository": source.get("github_repository"),
                "launchpad_repository": source.get("launchpad_repository"),
            }
            added = True

        return added

    def build_provenance_map(self, store_name, max_pages, max_recipes):
        """Return a provenance map joining store revisions to git commits.

        Shape:
            {
                "github_repository": "owner/repo" | None,
                "launchpad_repository": "~owner/proj/+git/name" | None,
                "git_repository_url": "https://..." | None,
                "revisions": {
                    "<store_revision>": {
                        "<arch>": {
                            "commit_sha": "...",
                            "commit_url": "https://github.com/.../commit/..."
                                          | None,
                            "build_id": "216436",
                        },
                    },
                },
            }

        Builds are merged across candidate recipes, since one store name can
        span several legitimate recipes each holding part of the history.
        Only uploaded builds with a ``revision_id`` are included; revision
        keys are strings so the map survives JSON round-trips.
        """
        recipes = self.get_recipes(store_name, max_recipes)

        result = {
            "github_repository": None,
            "launchpad_repository": None,
            "git_repository_url": None,
            "revisions": {},
            # Set when an upstream request failed, so callers can avoid
            # caching a transient failure as a negative answer.
            "failed": False,
            "reason": None,
        }

        if not recipes:
            return result

        candidates = [
            recipe
            for recipe in recipes
            if recipe.get("completed_builds_collection_link")
        ]
        if not candidates:
            return result

        # Share the page budget across candidates: revisions being resolved
        # are recent and builds are newest first, so breadth beats depth.
        pages_each = max(1, max_pages // len(candidates))

        # receopes are fetched in parallel
        with ThreadPoolExecutor(
            max_workers=min(MAX_CONCURRENT_SCANS, len(candidates))
        ) as executor:
            scans = list(
                executor.map(
                    lambda recipe: self._scan_recipe(recipe, pages_each),
                    candidates,
                )
            )

        revisions = result["revisions"]
        source = None
        fallback = None

        for recipe, (builds, reason) in zip(candidates, scans):
            recipe_src = recipe_source(recipe)
            if fallback is None:
                fallback = recipe_src

            if (
                self._merge_builds(builds, recipe_src, revisions)
                and source is None
            ):
                # The recipe that produced revisions, not the first sorted.
                source = recipe_src

            if reason and not result["failed"]:
                result["failed"] = True
                result["reason"] = reason

        if source is None:
            source = fallback
        if source:
            result["git_repository_url"] = source["git_repository_url"]
            result["github_repository"] = source["github_repository"]
            result["launchpad_repository"] = source["launchpad_repository"]

        return result
