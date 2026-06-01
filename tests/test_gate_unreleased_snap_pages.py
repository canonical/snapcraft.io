from unittest.mock import patch

from tests.endpoints.endpoint_testing import TestEndpoints


class TestGateUnreleasedSnapPages(TestEndpoints):
    """
    The blueprint-level gate blocks state-changing requests to per-<snap_name>
    routes when the snap has no published revisions. Read requests, skip-listed
    endpoints, and dashboard errors must pass through.
    """

    snap_name = "test-snap"

    def _expect_release_history(self, mock_dashboard, revisions):
        mock_dashboard.snap_release_history.return_value = {
            "revisions": revisions,
        }

    @patch("webapp.decorators._dashboard")
    def test_post_blocked_for_snap_with_no_revisions(self, mock_dashboard):
        self._expect_release_history(mock_dashboard, revisions=[])

        response = self.client.post(f"/api/{self.snap_name}/listing")

        self.assertEqual(403, response.status_code)
        body = response.get_json()
        self.assertFalse(body["success"])
        self.assertEqual("no-releases", body["errors"][0]["code"])

    @patch("webapp.decorators._dashboard")
    def test_post_passes_through_for_snap_with_revisions(self, mock_dashboard):
        self._expect_release_history(
            mock_dashboard, revisions=[{"revision": 1}]
        )

        response = self.client.post(f"/api/{self.snap_name}/listing")

        # Gate is out of the way; the downstream handler runs. We don't assert
        # the exact downstream response, only that it isn't the gate's 403.
        self.assertNotEqual(403, response.status_code)

    @patch("webapp.decorators._dashboard")
    def test_get_is_not_gated(self, mock_dashboard):
        # snap_release_history should not even be consulted for a GET request.
        mock_dashboard.snap_release_history.side_effect = AssertionError(
            "GET should bypass the gate"
        )

        # We don't care about the eventual status — only that the gate did not
        # short-circuit with 403 and did not call snap_release_history.
        self.client.get(f"/api/{self.snap_name}/listing")
        mock_dashboard.snap_release_history.assert_not_called()

    @patch("webapp.decorators._dashboard")
    def test_delete_package_endpoint_is_skip_listed(self, mock_dashboard):
        # delete_package must remain reachable so users can unregister names
        # that have never had a release.
        self._expect_release_history(mock_dashboard, revisions=[])

        response = self.client.delete(f"/packages/{self.snap_name}")

        self.assertNotEqual(403, response.status_code)
        mock_dashboard.snap_release_history.assert_not_called()

    @patch("webapp.decorators._dashboard")
    def test_dashboard_error_does_not_block_request(self, mock_dashboard):
        mock_dashboard.snap_release_history.side_effect = Exception("boom")

        response = self.client.post(f"/api/{self.snap_name}/listing")

        # On dashboard failure the gate passes through; do not return 403.
        self.assertNotEqual(403, response.status_code)

    @patch("webapp.decorators._dashboard")
    def test_unauthenticated_request_is_not_gated(self, mock_dashboard):
        unauth_client = self.app.test_client()
        mock_dashboard.snap_release_history.side_effect = AssertionError(
            "Unauthenticated requests should bypass the gate"
        )

        response = unauth_client.post(f"/api/{self.snap_name}/listing")

        # login_required redirects to /login; the gate should not be the one
        # short-circuiting the request.
        self.assertNotEqual(403, response.status_code)
        mock_dashboard.snap_release_history.assert_not_called()
