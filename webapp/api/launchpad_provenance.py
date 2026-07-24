import os
import re

from webapp.api.requests import Session

LAUNCHPAD_API_URL = os.getenv(
    "LAUNCHPAD_API_URL", "https://api.launchpad.net/devel/"
)


def extract_github_repository(git_repository_url):
    """
    Extract owner/repo from a GitHub repository URL.

    Returns the "owner/repo" part of the URL, or None if it is not a
    GitHub URL (e.g. a private or non-GitHub git repository).
    """
    if not git_repository_url:
        return None

    match = re.search(
        r"github\.com/(?P<repo>.+/.+?)(?:\.git)?/?$", git_repository_url
    )
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

    def get_recipe(self, store_name):
        """Find the public Launchpad recipe for a store name.

        No owner filter is applied, so any public recipe is covered. Returns
        the first entry whose ``store_name`` matches, or None.
        """
        data = self._get(
            f"{self.api_url}+snaps",
            params={
                "ws.op": "findByStoreName",
                "store_name": f'"{store_name}"',
            },
        )

        for entry in data.get("entries", []):
            if entry.get("store_name") == store_name:
                return entry

        return None

    def iter_builds(self, collection_link, max_pages):
        """Collect completed build entries, following pagination up to
        ``max_pages`` pages of the collection.

        Returns ``(entries, complete)``. If a page request fails (e.g. a
        Launchpad timeout) we stop early and return whatever was gathered with
        ``complete=False``, so one slow page yields partial results instead of
        discarding everything. ``complete`` is True only when every page up to
        the natural end (or the page bound) was fetched successfully.
        """
        entries = []
        url = collection_link
        pages = 0

        while url and pages < max_pages:
            try:
                data = self._get(url)
            except Exception:
                return entries, False
            entries.extend(data.get("entries", []))
            url = data.get("next_collection_link")
            pages += 1

        return entries, True

    def build_provenance_map(self, store_name, max_pages):
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

        Only builds that were successfully uploaded to the store and carry a
        git ``revision_id`` are included. Revision keys are strings so the map
        survives JSON (cache) round-trips.
        """
        recipe = self.get_recipe(store_name)

        result = {
            "github_repository": None,
            "git_repository_url": None,
            "revisions": {},
            # Whether the full build history (up to the page bound) was
            # scanned. Callers should only cache complete results so a
            # transient Launchpad failure isn't cached as a negative answer.
            "complete": True,
        }

        if not recipe:
            return result

        git_repository_url = recipe.get("git_repository_url")
        github_repository = extract_github_repository(git_repository_url)
        result["git_repository_url"] = git_repository_url
        result["github_repository"] = github_repository

        collection_link = recipe.get("completed_builds_collection_link")
        if not collection_link:
            return result

        revisions = result["revisions"]

        builds, complete = self.iter_builds(collection_link, max_pages)
        result["complete"] = complete

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
            }

        return result
