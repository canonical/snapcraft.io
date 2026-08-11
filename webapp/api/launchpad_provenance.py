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
    """
    Extract owner/repo from a GitHub repository URL.

    Returns the "owner/repo" part of the URL, or None if it is not a
    GitHub URL (e.g. a private or non-GitHub git repository).
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

        No owner filter is applied, so any public recipe is covered. A store
        name is free text on a recipe, so one name routinely matches dozens
        of them (firefox matches 62) — mostly personal recipes that never
        upload to the store. Taking the first match would pick one of those
        and report no provenance for a snap that has plenty.

        Candidates are ordered by how likely they are to have produced the
        store's revisions: recipes that can upload to the store first, then
        most recently modified. Returns ``(recipes, total)`` where ``total``
        is how many matched before the ``max_recipes`` cap, so callers can
        tell that some were left unscanned.
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

        return matches[:max_recipes], len(matches)

    def iter_builds(self, collection_link, max_pages):
        """Collect completed build entries, following pagination up to
        ``max_pages`` pages of the collection.

        Returns ``(entries, complete, failed)``.

        ``complete`` is True only when pagination reached its natural end.
        Stopping at ``max_pages`` leaves it False, so callers know a missing
        revision may just be unscanned history rather than a real absence.

        ``failed`` is True when a page request errored (e.g. a Launchpad
        timeout). Whatever was gathered is still returned, but the result
        should not be cached for long.
        """
        entries = []
        url = collection_link
        pages = 0

        while url and pages < max_pages:
            try:
                data = self._get(url)
            except Exception:
                return entries, False, True
            entries.extend(data.get("entries", []))
            url = data.get("next_collection_link")
            pages += 1

        return entries, not url, False

    def _merge_builds(self, builds, github_repository, revisions):
        """Fold one recipe's builds into the shared revision map.

        Returns True if anything was added. Earlier (better-ranked) recipes
        win on conflict, so the best candidate's provenance is the one kept.
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
            # Builds are ordered newest first; keep the first (latest) build
            # seen for a given revision+arch so the result is deterministic.
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
                # Turn the API self_link into the human-facing web URL, e.g.
                # https://api.launchpad.net/devel/~x/+snap/y/+build/1 ->
                # https://launchpad.net/~x/+snap/y/+build/1
                build_url = self_link.replace(
                    "api.launchpad.net/devel/", "launchpad.net/"
                )

            arch_map[arch] = {
                "commit_sha": commit_sha,
                "commit_url": commit_url,
                "build_id": build_id,
                "build_url": build_url,
                # Kept per entry: a merged map can span recipes with different
                # sources, so the top-level repository can't speak for a row.
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

        Builds are merged across every candidate recipe, since one store name
        can be spread over several legitimate recipes (different series or
        maintainers) that each produced part of the revision history.

        Only builds that were successfully uploaded to the store and carry a
        git ``revision_id`` are included. Revision keys are strings so the map
        survives JSON (cache) round-trips.
        """
        recipes, total = self.get_recipes(store_name, max_recipes)

        result = {
            "github_repository": None,
            "git_repository_url": None,
            "revisions": {},
            # Whether the whole build history was scanned. A truncated scan
            # still holds valid data: the revisions it found are authoritative,
            # only a miss is inconclusive.
            "complete": True,
            # Whether an upstream request failed, so callers can avoid caching
            # a transient failure as a negative answer.
            "failed": False,
        }

        if not recipes:
            return result

        # Recipes past the cap go unscanned, so a miss stays inconclusive.
        if total > len(recipes):
            result["complete"] = False

        # Share the page budget across candidates rather than spending it all
        # on the first: the revisions being resolved are recent ones, and each
        # recipe's builds are newest first, so breadth beats depth here.
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

            builds, complete, failed = self.iter_builds(
                collection_link, pages_each
            )
            if not complete:
                result["complete"] = False
            if failed:
                result["failed"] = True

            if (
                self._merge_builds(builds, github_repository, revisions)
                and source is None
            ):
                # Report the recipe that actually produced revisions, not
                # whichever happened to sort first.
                source = (git_repository_url, github_repository)

        if source is None:
            source = fallback
        if source:
            result["git_repository_url"] = source[0]
            result["github_repository"] = source[1]

        return result
