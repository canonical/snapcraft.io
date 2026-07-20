from unittest.mock import patch

from tests.endpoints.endpoint_testing import TestEndpoints


def _channel(arch, track, risk, revision):
    return {
        "channel": {
            "architecture": arch,
            "track": track,
            "risk": risk,
            "name": f"{track}/{risk}",
            "released-at": "2024-03-28T05:16:07.500510+00:00",
        },
        "revision": revision,
        "version": "1.0",
        "confinement": "strict",
        "download": {"size": 100},
    }


def _details(channel_map, default_track="latest"):
    return {
        "channel-map": channel_map,
        "default-track": default_track,
        "snap": {},
    }


def _provenance(
    revisions, github_repository="snapcrafters/mumble", complete=True
):
    return {
        "github_repository": github_repository,
        "git_repository_url": "https://github.com/snapcrafters/mumble",
        "revisions": revisions,
        "complete": complete,
    }


VERIFIED_BUILD = {
    "commit_sha": "10c7c9e1234567890",
    "commit_url": (
        "https://github.com/snapcrafters/mumble/commit/10c7c9e1234567890"
    ),
    "build_id": "216436",
    "build_url": (
        "https://launchpad.net/~build.snapcraft.io/+snap/x/+build/216436"
    ),
}


class TestAuditableEndpoint(TestEndpoints):
    def setUp(self):
        super().setUp()
        # Force cache miss so build_provenance_map is always exercised.
        cache_patcher = patch("webapp.endpoints.snaps.redis_cache")
        self.cache_patch = cache_patcher.start()
        self.cache_patch.get.return_value = None
        self.addCleanup(cache_patcher.stop)

    @patch("webapp.endpoints.snaps.device_gateway.get_item_details")
    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_auditable_hit(self, mock_map, mock_details):
        mock_details.return_value = _details(
            [_channel("amd64", "latest", "stable", 1721)]
        )
        mock_map.return_value = _provenance(
            {"1721": {"amd64": VERIFIED_BUILD}}
        )

        response = self.client.get("/api/mumble/auditable")
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["auditable"])
        self.assertEqual(data["status"], "verified")
        self.assertEqual(data["revision"], 1721)
        self.assertEqual(data["architecture"], "amd64")
        self.assertEqual(data["commit_sha"], "10c7c9e1234567890")
        self.assertEqual(data["github_repository"], "snapcrafters/mumble")
        self.assertIn("commit/10c7c9e", data["commit_url"])
        self.assertEqual(data["build_id"], "216436")

    @patch("webapp.endpoints.snaps.device_gateway.get_item_details")
    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_prefers_amd64(self, mock_map, mock_details):
        mock_details.return_value = _details(
            [
                _channel("arm64", "latest", "stable", 1798),
                _channel("amd64", "latest", "stable", 1721),
            ]
        )
        mock_map.return_value = _provenance(
            {
                "1721": {"amd64": VERIFIED_BUILD},
                "1798": {"arm64": VERIFIED_BUILD},
            }
        )

        data = self.client.get("/api/mumble/auditable").get_json()

        self.assertTrue(data["auditable"])
        self.assertEqual(data["architecture"], "amd64")
        self.assertEqual(data["revision"], 1721)

    @patch("webapp.endpoints.snaps.device_gateway.get_item_details")
    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_deterministic_arch_fallback(self, mock_map, mock_details):
        # No amd64 -> first architecture sorted alphabetically (arm64).
        mock_details.return_value = _details(
            [
                _channel("armhf", "latest", "stable", 900),
                _channel("arm64", "latest", "stable", 800),
            ]
        )
        mock_map.return_value = _provenance(
            {
                "800": {"arm64": VERIFIED_BUILD},
                "900": {"armhf": VERIFIED_BUILD},
            }
        )

        data = self.client.get("/api/mumble/auditable").get_json()

        self.assertTrue(data["auditable"])
        self.assertEqual(data["architecture"], "arm64")
        self.assertEqual(data["revision"], 800)

    @patch("webapp.endpoints.snaps.device_gateway.get_item_details")
    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_unavailable_when_revision_absent(self, mock_map, mock_details):
        # Public recipe exists (github_repository set) but this revision has no
        # matching build -> "unavailable", not "not-provided".
        mock_details.return_value = _details(
            [_channel("amd64", "latest", "stable", 1721)]
        )
        mock_map.return_value = _provenance({})

        data = self.client.get("/api/mumble/auditable").get_json()

        self.assertFalse(data["auditable"])
        self.assertEqual(data["status"], "unavailable")
        self.assertEqual(data["revision"], 1721)
        self.assertEqual(data["architecture"], "amd64")

    @patch("webapp.endpoints.snaps.device_gateway.get_item_details")
    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_not_provided_when_no_public_recipe(self, mock_map, mock_details):
        # No public GitHub recipe (private / non-GitHub) -> "not-provided".
        mock_details.return_value = _details(
            [_channel("amd64", "latest", "stable", 1721)]
        )
        mock_map.return_value = _provenance({}, github_repository=None)

        data = self.client.get("/api/mumble/auditable").get_json()

        self.assertFalse(data["auditable"])
        self.assertEqual(data["status"], "not-provided")
        self.assertEqual(data["revision"], 1721)

    @patch("webapp.endpoints.snaps.device_gateway.get_item_details")
    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_non_github_repo_is_not_provided(self, mock_map, mock_details):
        mock_details.return_value = _details(
            [_channel("amd64", "latest", "stable", 1721)]
        )
        # Non-GitHub build: commit_url is None and no github repository.
        no_link_build = dict(VERIFIED_BUILD, commit_url=None)
        mock_map.return_value = _provenance(
            {"1721": {"amd64": no_link_build}}, github_repository=None
        )

        data = self.client.get("/api/mumble/auditable").get_json()

        self.assertFalse(data["auditable"])
        self.assertEqual(data["status"], "not-provided")

    @patch("webapp.endpoints.snaps.device_gateway.get_item_details")
    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_upstream_failure_reports_error(self, mock_map, mock_details):
        mock_details.return_value = _details(
            [_channel("amd64", "latest", "stable", 1721)]
        )
        mock_map.side_effect = Exception("launchpad down")

        response = self.client.get("/api/mumble/auditable")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(), {"auditable": False, "status": "error"}
        )

    @patch("webapp.endpoints.snaps.device_gateway.get_item_details")
    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_incomplete_scan_reports_error(self, mock_map, mock_details):
        # Revision not found because Launchpad couldn't be fully scanned ->
        # error (with rev/arch), not a plain "no provenance".
        mock_details.return_value = _details(
            [_channel("amd64", "latest", "stable", 1721)]
        )
        mock_map.return_value = _provenance({}, complete=False)

        data = self.client.get("/api/mumble/auditable").get_json()

        self.assertFalse(data["auditable"])
        self.assertEqual(data["status"], "error")
        self.assertEqual(data["revision"], 1721)
        self.assertEqual(data["architecture"], "amd64")


class TestAuditableRevisionsEndpoint(TestEndpoints):
    def setUp(self):
        super().setUp()
        self.cache_patch = patch("webapp.endpoints.snaps.redis_cache").start()
        self.cache_patch.get.return_value = None
        self.addCleanup(patch.stopall)

    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_returns_flattened_revisions(self, mock_map):
        mock_map.return_value = _provenance(
            {
                "1721": {"amd64": VERIFIED_BUILD},
                "1798": {"arm64": VERIFIED_BUILD},
            }
        )

        data = self.client.get("/api/mumble/auditable-revisions").get_json()

        self.assertEqual(data["github_repository"], "snapcrafters/mumble")
        self.assertIn("1721", data["revisions"])
        self.assertIn("1798", data["revisions"])
        self.assertEqual(
            data["revisions"]["1721"]["commit_sha"], "10c7c9e1234567890"
        )

    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_revisions_failure_reports_error(self, mock_map):
        mock_map.side_effect = Exception("launchpad down")

        response = self.client.get("/api/mumble/auditable-revisions")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {"github_repository": None, "revisions": {}, "error": True},
        )

    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_revisions_incomplete_sets_error_flag(self, mock_map):
        mock_map.return_value = _provenance(
            {"1721": {"amd64": VERIFIED_BUILD}}, complete=False
        )

        data = self.client.get("/api/mumble/auditable-revisions").get_json()

        self.assertTrue(data["error"])
        # Partial data is still returned.
        self.assertIn("1721", data["revisions"])
