import os
import re

from webapp.api.requests import Session

LAUNCHPAD_API_URL = os.getenv(
    "LAUNCHPAD_API_URL", "https://api.launchpad.net/devel/"
)


GITHUB_URL_RE = re.compile(
    r"^(?:https?://)?(?:www\.)?github\.com/"
    r"(?P<repo>[^/]+/[^/]+?)(?:\.git)?/?$"
)


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


class LaunchpadProvenance:
    """Read-only, anonymous client for Launchpad build provenance.

    Unlike the authenticated ``canonicalwebteam.launchpad`` client, this one
    sends no OAuth credentials and does not filter recipes by owner, so it can
    read provenance for *any* public Launchpad recipe. It is used to link a
    store revision back to the public git commit it was built from.
    """

    def __init__(self, session=None, api_url=LAUNCHPAD_API_URL):
        self.api_url = api_url
        self.session = session or Session()
        self.session.headers["Accept"] = "application/json"

    def _get(self, url, params=None):
        response = self.session.get(url, params=params)
        response.raise_for_status()
        return response.json()

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

    def iter_builds(self, collection_link, max_pages):
        """Collect completed builds, up to ``max_pages`` pages.

        Returns ``(entries, failed)``; whatever was gathered is returned
        even when a page request errored.
        """
        entries = []
        url = collection_link
        pages = 0

        while url and pages < max_pages:
            try:
                data = self._get(url)
            except Exception:
                return entries, True
            entries.extend(data.get("entries", []))
            url = data.get("next_collection_link")
            pages += 1

        return entries, False

    def _merge_builds(self, builds, github_repository, revisions):
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

            commit_url = None
            if github_repository:
                commit_url = (
                    f"https://github.com/{github_repository}"
                    f"/commit/{commit_sha}"
                )

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
                "github_repository": github_repository,
            }
            added = True

        return added

    def build_provenance_map(self, store_name, max_pages, max_recipes):
        """Return a provenance map joining store revisions to git commits.

        Shape:
            {
                "github_repository": "owner/repo" | None,
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
            "git_repository_url": None,
            "revisions": {},
            # Set when an upstream request failed, so callers can avoid
            # caching a transient failure as a negative answer.
            "failed": False,
        }

        if not recipes:
            return result

        # Share the page budget across candidates: revisions being resolved
        # are recent and builds are newest first, so breadth beats depth.
        pages_each = max(1, max_pages // len(recipes))
        revisions = result["revisions"]
        source = None
        fallback = None

        for recipe in recipes:
            collection_link = recipe.get("completed_builds_collection_link")
            if not collection_link:
                continue

            git_repository_url = recipe.get("git_repository_url")
            github_repository = extract_github_repository(git_repository_url)
            if fallback is None:
                fallback = (git_repository_url, github_repository)

            builds, failed = self.iter_builds(collection_link, pages_each)

            if (
                self._merge_builds(builds, github_repository, revisions)
                and source is None
            ):
                # The recipe that produced revisions, not the first sorted.
                source = (git_repository_url, github_repository)

            if failed:
                # Launchpad is struggling, scanning the remaining candidates
                # would just queue up more 12s timeouts on this request.
                result["failed"] = True
                break

        if source is None:
            source = fallback
        if source:
            result["git_repository_url"] = source[0]
            result["github_repository"] = source[1]

        return result
