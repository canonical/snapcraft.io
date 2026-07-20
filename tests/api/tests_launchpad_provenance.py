from unittest import TestCase
from unittest.mock import MagicMock

from webapp.api.launchpad_provenance import (
    LaunchpadProvenance,
    extract_github_repository,
)


def _response(payload):
    resp = MagicMock()
    resp.json.return_value = payload
    resp.raise_for_status.return_value = None
    return resp


def _build(arch, revision, commit, status="Uploaded", build_id="216436"):
    return {
        "arch_tag": arch,
        "store_upload_revision": revision,
        "revision_id": commit,
        "store_upload_status": status,
        "self_link": (
            "https://api.launchpad.net/devel/~build.snapcraft.io"
            f"/+snap/x/+build/{build_id}"
        ),
    }


class TestExtractGithubRepository(TestCase):
    def test_github_url(self):
        self.assertEqual(
            extract_github_repository(
                "https://github.com/snapcrafters/mumble"
            ),
            "snapcrafters/mumble",
        )

    def test_github_url_with_git_suffix(self):
        self.assertEqual(
            extract_github_repository(
                "https://github.com/snapcrafters/mumble.git"
            ),
            "snapcrafters/mumble",
        )

    def test_non_github_url(self):
        self.assertIsNone(
            extract_github_repository("https://gitlab.com/foo/bar")
        )

    def test_none(self):
        self.assertIsNone(extract_github_repository(None))


class TestBuildProvenanceMap(TestCase):
    def _client(self, recipe, build_pages):
        """Build a client whose session returns the recipe for the +snaps
        lookup and successive build pages for the collection link."""
        session = MagicMock()
        pages = iter(build_pages)

        def get(url, params=None):
            if url.endswith("+snaps"):
                return _response(recipe)
            return _response(next(pages))

        session.get.side_effect = get
        return LaunchpadProvenance(session=session)

    def test_join_and_filtering(self):
        recipe = {
            "entries": [
                {
                    "store_name": "mumble",
                    "git_repository_url": (
                        "https://github.com/snapcrafters/mumble"
                    ),
                    "completed_builds_collection_link": (
                        "https://api.launchpad.net/devel/x/completed_builds"
                    ),
                }
            ]
        }
        builds_page = {
            "entries": [
                _build("amd64", 1721, "aaaaaaa000"),
                _build("arm64", 1798, "bbbbbbb111"),
                # Skipped: not uploaded.
                _build("armhf", 1799, "ccccccc222", status="Failed"),
                # Skipped: no commit.
                _build("s390x", 1800, None),
            ],
            "next_collection_link": None,
        }

        client = self._client(recipe, [builds_page])
        result = client.build_provenance_map("mumble", max_pages=5)

        self.assertTrue(result["complete"])
        self.assertEqual(result["github_repository"], "snapcrafters/mumble")
        self.assertIn("1721", result["revisions"])
        self.assertIn("1798", result["revisions"])
        self.assertNotIn("1799", result["revisions"])
        self.assertNotIn("1800", result["revisions"])

        amd64 = result["revisions"]["1721"]["amd64"]
        self.assertEqual(amd64["commit_sha"], "aaaaaaa000")
        self.assertEqual(
            amd64["commit_url"],
            "https://github.com/snapcrafters/mumble/commit/aaaaaaa000",
        )
        self.assertEqual(amd64["build_id"], "216436")
        self.assertEqual(
            amd64["build_url"],
            "https://launchpad.net/~build.snapcraft.io/+snap/x/+build/216436",
        )

    def test_pagination_is_bounded(self):
        recipe = {
            "entries": [
                {
                    "store_name": "mumble",
                    "git_repository_url": (
                        "https://github.com/snapcrafters/mumble"
                    ),
                    "completed_builds_collection_link": "https://lp/p1",
                }
            ]
        }
        page1 = {
            "entries": [_build("amd64", 1721, "aaa")],
            "next_collection_link": "https://lp/p2",
        }
        page2 = {
            "entries": [_build("arm64", 1798, "bbb")],
            "next_collection_link": "https://lp/p3",
        }

        client = self._client(recipe, [page1, page2])
        result = client.build_provenance_map("mumble", max_pages=1)

        # Only the first page is scanned; hitting the bound is still complete.
        self.assertTrue(result["complete"])
        self.assertIn("1721", result["revisions"])
        self.assertNotIn("1798", result["revisions"])

    def test_partial_result_when_a_page_fails(self):
        # A Launchpad timeout on page 2 must not discard page 1's data, and the
        # result must be flagged incomplete so callers don't cache it.
        recipe = {
            "entries": [
                {
                    "store_name": "mumble",
                    "git_repository_url": (
                        "https://github.com/snapcrafters/mumble"
                    ),
                    "completed_builds_collection_link": "https://lp/p1",
                }
            ]
        }
        page1 = {
            "entries": [_build("amd64", 1721, "aaa")],
            "next_collection_link": "https://lp/p2",
        }
        session = MagicMock()
        calls = {"builds": 0}

        def get(url, params=None):
            if url.endswith("+snaps"):
                return _response(recipe)
            calls["builds"] += 1
            if calls["builds"] == 1:
                return _response(page1)
            raise Exception("read timed out")

        session.get.side_effect = get
        client = LaunchpadProvenance(session=session)
        result = client.build_provenance_map("mumble", max_pages=5)

        self.assertFalse(result["complete"])
        self.assertIn("1721", result["revisions"])

    def test_non_github_repo_yields_no_commit_url(self):
        recipe = {
            "entries": [
                {
                    "store_name": "mumble",
                    "git_repository_url": "https://gitlab.com/foo/mumble",
                    "completed_builds_collection_link": "https://lp/p1",
                }
            ]
        }
        page = {
            "entries": [_build("amd64", 1721, "aaa")],
            "next_collection_link": None,
        }

        client = self._client(recipe, [page])
        result = client.build_provenance_map("mumble", max_pages=5)

        self.assertIsNone(result["github_repository"])
        self.assertIsNone(result["revisions"]["1721"]["amd64"]["commit_url"])

    def test_no_recipe_returns_empty(self):
        session = MagicMock()
        session.get.return_value = _response({"entries": []})
        client = LaunchpadProvenance(session=session)

        result = client.build_provenance_map("ghost-snap", max_pages=5)

        self.assertEqual(result["github_repository"], None)
        self.assertEqual(result["revisions"], {})
