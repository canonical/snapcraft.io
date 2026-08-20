from unittest.mock import patch

from tests.endpoints.endpoint_testing import TestEndpoints
from webapp.endpoints.snaps import (
    FAILED_PROVENANCE_TTL,
    _get_provenance_map,
)


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
    revisions,
    github_repository="snapcrafters/mumble",
    failed=False,
):
    return {
        "github_repository": github_repository,
        "git_repository_url": "https://github.com/snapcrafters/mumble",
        "revisions": revisions,
        "failed": failed,
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


class TestProvenanceMapCaching(TestEndpoints):
    """What gets cached decides whether a Launchpad wobble becomes a storm."""

    def setUp(self):
        super().setUp()
        cache_patcher = patch("webapp.endpoints.snaps.redis_cache")
        self.cache_patch = cache_patcher.start()
        self.cache_patch.get.return_value = None
        self.addCleanup(cache_patcher.stop)

    def _ttl_for(self, provenance_map):
        with patch(
            "webapp.endpoints.snaps.launchpad_provenance."
            "build_provenance_map",
            return_value=provenance_map,
        ):
            _get_provenance_map("mumble")
        return self.cache_patch.set.call_args.kwargs["ttl"]

    def test_successful_scan_is_cached_for_an_hour(self):
        # Includes scans that stopped at their bounds: partial but valid.
        self.assertEqual(self._ttl_for(_provenance({})), 3600)

    def test_failed_scan_is_cached_briefly(self):
        ttl = self._ttl_for(_provenance({}, failed=True))
        self.assertEqual(ttl, FAILED_PROVENANCE_TTL)
        self.assertLess(ttl, 3600)

    @patch("webapp.endpoints.snaps.repository_is_public")
    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_repository_is_checked_once_and_cached(
        self, mock_map, mock_public
    ):
        # One call per map build, not one per page view.
        mock_map.return_value = _provenance({})
        mock_public.return_value = False

        result = _get_provenance_map("mumble")

        mock_public.assert_called_once_with("snapcrafters/mumble")
        self.assertFalse(result["source_available"])
        cached = self.cache_patch.set.call_args.args[1]
        self.assertFalse(cached["source_available"])


class TestAuditableEndpoint(TestEndpoints):
    def setUp(self):
        super().setUp()
        # Force cache miss so build_provenance_map is always exercised.
        cache_patcher = patch("webapp.endpoints.snaps.redis_cache")
        self.cache_patch = cache_patcher.start()
        self.cache_patch.get.return_value = None
        self.addCleanup(cache_patcher.stop)
        # Real HTTP; keep it off the network.
        public_patcher = patch(
            "webapp.endpoints.snaps.repository_is_public", return_value=True
        )
        self.public_patch = public_patcher.start()
        self.addCleanup(public_patcher.stop)

    @patch("webapp.endpoints.snaps.device_gateway.get_item_details")
    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_auditable_hit(self, mock_map, mock_details):
        mock_details.return_value = _details(
            [_channel("amd64", "latest", "stable", 1721)]
        )
        mock_map.return_value = _provenance(
            {"1721": {"amd64": VERIFIED_BUILD}}
        )

        response = self.app.test_client().get("/api/mumble/auditable")
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
        self.assertEqual(response.cache_control.max_age, 3600)

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

        response = self.app.test_client().get("/api/mumble/auditable")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(), {"auditable": False, "status": "error"}
        )
        self.assertEqual(response.cache_control.max_age, 0)

    @patch("webapp.endpoints.snaps.device_gateway.get_item_details")
    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_failed_scan_reports_error(self, mock_map, mock_details):
        # The one case where retrying might help.
        mock_details.return_value = _details(
            [_channel("amd64", "latest", "stable", 1721)]
        )
        mock_map.return_value = _provenance({}, failed=True)

        data = self.client.get("/api/mumble/auditable").get_json()

        self.assertFalse(data["auditable"])
        self.assertEqual(data["status"], "error")
        self.assertEqual(data["revision"], 1721)
        self.assertEqual(data["architecture"], "amd64")

    @patch("webapp.endpoints.snaps.device_gateway.get_item_details")
    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_bounded_scan_is_not_an_error(self, mock_map, mock_details):
        # Hitting the scan bounds must not pin an error on a snap forever.
        mock_details.return_value = _details(
            [_channel("amd64", "latest", "stable", 1721)]
        )
        mock_map.return_value = _provenance({}, github_repository=None)

        data = self.client.get("/api/mumble/auditable").get_json()

        self.assertFalse(data["auditable"])
        self.assertEqual(data["status"], "not-provided")

    @patch("webapp.endpoints.snaps.device_gateway.get_item_details")
    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_deleted_repository_is_not_verified(self, mock_map, mock_details):
        # The commit link would 404, so offering it is worse than nothing.
        mock_details.return_value = _details(
            [_channel("amd64", "latest", "stable", 1721)]
        )
        mock_map.return_value = _provenance(
            {"1721": {"amd64": VERIFIED_BUILD}}
        )
        self.public_patch.return_value = False

        data = self.client.get("/api/mumble/auditable").get_json()

        self.assertFalse(data["auditable"])
        self.assertEqual(data["status"], "not-provided")
        self.assertNotIn("commit_url", data)

    @patch("webapp.endpoints.snaps.device_gateway.get_item_details")
    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_build_without_commit_url_is_not_an_error(
        self, mock_map, mock_details
    ):
        # Build found, but no GitHub commit to link: settled, not a failure.
        mock_details.return_value = _details(
            [_channel("amd64", "latest", "stable", 1721)]
        )
        mock_map.return_value = _provenance(
            {"1721": {"amd64": {"commit_sha": "aaa", "commit_url": None}}},
            github_repository=None,
        )

        data = self.client.get("/api/mumble/auditable").get_json()

        self.assertFalse(data["auditable"])
        self.assertEqual(data["status"], "not-provided")

    @patch("webapp.endpoints.snaps.device_gateway.get_item_details")
    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_hit_in_truncated_scan_is_still_verified(
        self, mock_map, mock_details
    ):
        # A found revision is authoritative however many pages went unread.
        mock_details.return_value = _details(
            [_channel("amd64", "latest", "stable", 1721)]
        )
        mock_map.return_value = _provenance(
            {"1721": {"amd64": VERIFIED_BUILD}}
        )

        data = self.client.get("/api/mumble/auditable").get_json()

        self.assertTrue(data["auditable"])
        self.assertEqual(data["status"], "verified")


class TestAuditableRevisionsEndpoint(TestEndpoints):
    def setUp(self):
        super().setUp()
        self.cache_patch = patch("webapp.endpoints.snaps.redis_cache").start()
        self.cache_patch.get.return_value = None
        # Real HTTP; keep it off the network.
        self.public_patch = patch(
            "webapp.endpoints.snaps.repository_is_public", return_value=True
        ).start()
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

        response = self.app.test_client().get(
            "/api/mumble/auditable-revisions"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {"github_repository": None, "revisions": {}, "error": True},
        )
        self.assertEqual(response.cache_control.max_age, 0)

    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_revisions_omitted_when_repository_is_gone(self, mock_map):
        mock_map.return_value = _provenance(
            {"1721": {"amd64": VERIFIED_BUILD}}
        )
        self.public_patch.return_value = False

        data = self.client.get("/api/mumble/auditable-revisions").get_json()

        self.assertEqual(data["revisions"], {})
        self.assertFalse(data["error"])

    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_revisions_failed_scan_sets_error_flag(self, mock_map):
        mock_map.return_value = _provenance(
            {"1721": {"amd64": VERIFIED_BUILD}}, failed=True
        )

        data = self.client.get("/api/mumble/auditable-revisions").get_json()

        self.assertTrue(data["error"])
        # Partial data is still returned.
        self.assertIn("1721", data["revisions"])

    @patch("webapp.endpoints.snaps.launchpad_provenance.build_provenance_map")
    def test_revisions_truncated_scan_is_not_an_error(self, mock_map):
        # Bounded by LP_MAX_BUILD_PAGES by design, so not a failure.
        mock_map.return_value = _provenance(
            {"1721": {"amd64": VERIFIED_BUILD}}, failed=False
        )

        # Logged-in responses are rewritten to `private`, dropping max-age.
        response = self.app.test_client().get(
            "/api/mumble/auditable-revisions"
        )
        data = response.get_json()

        self.assertFalse(data["error"])
        self.assertIn("1721", data["revisions"])
        self.assertEqual(response.cache_control.max_age, 3600)
