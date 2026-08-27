from threading import Lock
from unittest import TestCase
from unittest.mock import MagicMock

from webapp.api.exceptions import ApiTimeoutError
from webapp.api.launchpad_provenance import (
    LaunchpadProvenance,
    extract_github_repository,
    extract_launchpad_repository,
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

    def test_trailing_slash(self):
        self.assertEqual(
            extract_github_repository(
                "https://github.com/snapcrafters/mumble/"
            ),
            "snapcrafters/mumble",
        )

    def test_non_github_host_containing_github_com(self):
        self.assertIsNone(
            extract_github_repository(
                "https://git.example.com/mirrors/github.com/torvalds/linux"
            )
        )

    def test_github_com_in_query_string(self):
        self.assertIsNone(
            extract_github_repository("https://evil.com/?x=github.com/foo/bar")
        )

    def test_extra_path_segments(self):
        self.assertIsNone(
            extract_github_repository("https://github.com/a/b/tree/main")
        )

    def test_missing_repository_name(self):
        self.assertIsNone(
            extract_github_repository("https://github.com/snapcrafters")
        )

    def test_none(self):
        self.assertIsNone(extract_github_repository(None))


class TestExtractLaunchpadRepository(TestCase):
    def test_project_repository(self):
        self.assertEqual(
            extract_launchpad_repository(
                "https://api.launchpad.net/devel/~mozilla-snaps"
                "/firefox-snap/+git/firefox-snap"
            ),
            "~mozilla-snaps/firefox-snap/+git/firefox-snap",
        )

    def test_distro_source_package_repository(self):
        self.assertEqual(
            extract_launchpad_repository(
                "https://api.launchpad.net/devel/~hellsworth/ubuntu"
                "/+source/libreoffice/+git/libreoffice-snap"
            ),
            "~hellsworth/ubuntu/+source/libreoffice/+git/libreoffice-snap",
        )

    def test_personal_repository(self):
        self.assertEqual(
            extract_launchpad_repository(
                "https://api.launchpad.net/devel/~someone/+git/thing"
            ),
            "~someone/+git/thing",
        )

    def test_trailing_slash(self):
        self.assertEqual(
            extract_launchpad_repository(
                "https://api.launchpad.net/devel/~a/b/+git/c/"
            ),
            "~a/b/+git/c",
        )

    def test_redacted_private_repository(self):
        self.assertIsNone(
            extract_launchpad_repository("tag:launchpad.net:2008:redacted")
        )

    def test_non_launchpad_host(self):
        self.assertIsNone(
            extract_launchpad_repository(
                "https://evil.com/?x=api.launchpad.net/devel/~a/+git/b"
            )
        )

    def test_not_a_git_link(self):
        self.assertIsNone(
            extract_launchpad_repository(
                "https://api.launchpad.net/devel/~mozilla-snaps"
            )
        )

    def test_none(self):
        self.assertIsNone(extract_launchpad_repository(None))


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
        result = client.build_provenance_map(
            "mumble", max_pages=5, max_recipes=5
        )

        self.assertFalse(result["failed"])
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
        result = client.build_provenance_map(
            "mumble", max_pages=1, max_recipes=5
        )

        # Stopping at the bound is not a failure; the data gathered is valid.
        self.assertFalse(result["failed"])
        self.assertIn("1721", result["revisions"])
        self.assertNotIn("1798", result["revisions"])

    def test_not_failed_when_pagination_ends_naturally(self):
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
            "next_collection_link": None,
        }

        client = self._client(recipe, [page1])
        result = client.build_provenance_map(
            "mumble", max_pages=5, max_recipes=5
        )

        self.assertFalse(result["failed"])

    def test_partial_result_when_a_page_fails(self):
        # A timeout on page 2 must not discard page 1's data.
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
        result = client.build_provenance_map(
            "mumble", max_pages=5, max_recipes=5
        )

        self.assertTrue(result["failed"])
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
        result = client.build_provenance_map(
            "mumble", max_pages=5, max_recipes=5
        )

        self.assertIsNone(result["github_repository"])
        self.assertIsNone(result["revisions"]["1721"]["amd64"]["commit_url"])

    def test_launchpad_hosted_repo_yields_commit_url(self):
        recipe = {
            "entries": [
                {
                    "store_name": "firefox",
                    "git_repository_url": None,
                    "git_repository_link": (
                        "https://api.launchpad.net/devel/~mozilla-snaps"
                        "/firefox-snap/+git/firefox-snap"
                    ),
                    "completed_builds_collection_link": "https://lp/p1",
                }
            ]
        }
        page = {
            "entries": [_build("amd64", 8763, "659a47f4")],
            "next_collection_link": None,
        }

        client = self._client(recipe, [page])
        result = client.build_provenance_map(
            "firefox", max_pages=5, max_recipes=5
        )

        self.assertIsNone(result["github_repository"])
        self.assertEqual(
            result["launchpad_repository"],
            "~mozilla-snaps/firefox-snap/+git/firefox-snap",
        )
        amd64 = result["revisions"]["8763"]["amd64"]
        self.assertEqual(
            amd64["commit_url"],
            "https://git.launchpad.net/~mozilla-snaps/firefox-snap"
            "/+git/firefox-snap/commit/?id=659a47f4",
        )

    def test_github_wins_over_launchpad_link(self):
        recipe = {
            "entries": [
                {
                    "store_name": "mumble",
                    "git_repository_url": (
                        "https://github.com/snapcrafters/mumble"
                    ),
                    "git_repository_link": (
                        "https://api.launchpad.net/devel/~x/+git/y"
                    ),
                    "completed_builds_collection_link": "https://lp/p1",
                }
            ]
        }
        page = {
            "entries": [_build("amd64", 1721, "aaa")],
            "next_collection_link": None,
        }

        client = self._client(recipe, [page])
        result = client.build_provenance_map(
            "mumble", max_pages=5, max_recipes=5
        )

        self.assertEqual(
            result["revisions"]["1721"]["amd64"]["commit_url"],
            "https://github.com/snapcrafters/mumble/commit/aaa",
        )

    def test_timeout_is_reported_as_launchpad_timeout(self):
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
        session = MagicMock()

        def get(url, params=None):
            if url.endswith("+snaps"):
                return _response(recipe)
            raise ApiTimeoutError("took too long")

        session.get.side_effect = get
        client = LaunchpadProvenance(session=session)
        result = client.build_provenance_map(
            "mumble", max_pages=5, max_recipes=5
        )

        self.assertTrue(result["failed"])
        self.assertEqual(result["reason"], "launchpad_timeout")

    def test_other_errors_are_reported_as_launchpad_error(self):
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
        session = MagicMock()

        def get(url, params=None):
            if url.endswith("+snaps"):
                return _response(recipe)
            raise Exception("boom")

        session.get.side_effect = get
        client = LaunchpadProvenance(session=session)
        result = client.build_provenance_map(
            "mumble", max_pages=5, max_recipes=5
        )

        self.assertEqual(result["reason"], "launchpad_error")

    def test_successful_scan_has_no_reason(self):
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
        page = {
            "entries": [_build("amd64", 1721, "aaa")],
            "next_collection_link": None,
        }

        client = self._client(recipe, [page])
        result = client.build_provenance_map(
            "mumble", max_pages=5, max_recipes=5
        )

        self.assertFalse(result["failed"])
        self.assertIsNone(result["reason"])

    def test_no_recipe_returns_empty(self):
        session = MagicMock()
        session.get.return_value = _response({"entries": []})
        client = LaunchpadProvenance(session=session)

        result = client.build_provenance_map(
            "ghost-snap", max_pages=5, max_recipes=5
        )

        self.assertEqual(result["github_repository"], None)
        self.assertEqual(result["revisions"], {})


def _recipe(name, url, link, uploads=True, modified="2026-01-01T00:00:00Z"):
    return {
        "store_name": "mumble",
        "git_repository_url": url,
        "completed_builds_collection_link": link,
        "can_upload_to_store": uploads,
        "date_last_modified": modified,
        "_name": name,
    }


class TestRecipeSelection(TestCase):
    """One store name matches many recipes, so the first is a lottery."""

    def _client(self, entries, pages_by_link):
        session = MagicMock()

        def get(url, params=None):
            if url.endswith("+snaps"):
                return _response({"entries": entries})
            return _response(pages_by_link[url])

        session.get.side_effect = get
        return LaunchpadProvenance(session=session)

    def test_scans_past_a_recipe_with_no_uploads(self):
        # The firefox shape: a personal recipe sorts above the real one.
        personal = _recipe("personal", None, "https://lp/personal")
        official = _recipe(
            "official",
            "https://github.com/snapcrafters/mumble",
            "https://lp/official",
        )
        pages = {
            "https://lp/personal": {
                "entries": [_build("amd64", 999, "zzz", status="Failed")],
                "next_collection_link": None,
            },
            "https://lp/official": {
                "entries": [_build("amd64", 1721, "aaa")],
                "next_collection_link": None,
            },
        }

        client = self._client([personal, official], pages)
        result = client.build_provenance_map(
            "mumble", max_pages=5, max_recipes=5
        )

        self.assertIn("1721", result["revisions"])
        # The reported source is the recipe that produced revisions.
        self.assertEqual(result["github_repository"], "snapcrafters/mumble")

    def test_merges_revisions_across_recipes(self):
        # Real recipes are split by series, each holding part of the history.
        old = _recipe("old", "https://github.com/x/old", "https://lp/old")
        new = _recipe("new", "https://github.com/x/new", "https://lp/new")
        pages = {
            "https://lp/old": {
                "entries": [_build("amd64", 1000, "aaa")],
                "next_collection_link": None,
            },
            "https://lp/new": {
                "entries": [_build("amd64", 2000, "bbb")],
                "next_collection_link": None,
            },
        }

        client = self._client([old, new], pages)
        result = client.build_provenance_map(
            "mumble", max_pages=5, max_recipes=5
        )

        self.assertIn("1000", result["revisions"])
        self.assertIn("2000", result["revisions"])
        # Each row carries its own repository, since they differ.
        self.assertEqual(
            result["revisions"]["1000"]["amd64"]["github_repository"], "x/old"
        )
        self.assertEqual(
            result["revisions"]["2000"]["amd64"]["github_repository"], "x/new"
        )

    def test_upload_capable_recipes_are_ranked_first(self):
        cannot = _recipe(
            "cannot",
            None,
            "https://lp/cannot",
            uploads=False,
            modified="2026-06-01T00:00:00Z",
        )
        can = _recipe(
            "can",
            "https://github.com/x/can",
            "https://lp/can",
            modified="2020-01-01T00:00:00Z",
        )
        pages = {
            "https://lp/can": {
                "entries": [_build("amd64", 1721, "aaa")],
                "next_collection_link": None,
            },
            "https://lp/cannot": {
                "entries": [_build("amd64", 1721, "zzz")],
                "next_collection_link": None,
            },
        }

        client = self._client([cannot, can], pages)
        result = client.build_provenance_map(
            "mumble", max_pages=5, max_recipes=5
        )

        # Ranked first despite being far older, and first writer wins.
        self.assertEqual(
            result["revisions"]["1721"]["amd64"]["commit_sha"], "aaa"
        )

    def test_max_recipes_bounds_the_scan(self):
        entries = [
            _recipe(f"r{i}", None, f"https://lp/r{i}") for i in range(4)
        ]
        pages = {
            f"https://lp/r{i}": {"entries": [], "next_collection_link": None}
            for i in range(4)
        }
        scanned = []

        session = MagicMock()

        def get(url, params=None):
            if url.endswith("+snaps"):
                return _response({"entries": entries})
            scanned.append(url)
            return _response(pages[url])

        session.get.side_effect = get
        client = LaunchpadProvenance(session=session)
        client.build_provenance_map("mumble", max_pages=5, max_recipes=2)

        self.assertEqual(len(scanned), 2)

    def test_failing_recipes_do_not_stack_up(self):
        entries = [
            _recipe(f"r{i}", None, f"https://lp/r{i}") for i in range(4)
        ]
        attempts = []
        lock = Lock()

        session = MagicMock()

        def get(url, params=None):
            if url.endswith("+snaps"):
                return _response({"entries": entries})
            with lock:
                attempts.append(url)
            raise Exception("read timed out")

        session.get.side_effect = get
        client = LaunchpadProvenance(session=session)
        result = client.build_provenance_map(
            "mumble", max_pages=5, max_recipes=4
        )

        self.assertTrue(result["failed"])
        self.assertEqual(
            sorted(attempts), [f"https://lp/r{i}" for i in range(4)]
        )
