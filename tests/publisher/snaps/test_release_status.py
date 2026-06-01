from unittest.mock import patch

from canonicalwebteam.exceptions import StoreApiResponseErrorList

from tests.endpoints.endpoint_testing import TestEndpoints


class TestGetReleaseStatus(TestEndpoints):
    snap_name = "test-snap"
    endpoint_url = f"/api/{snap_name}/release-status"

    @patch("webapp.publisher.snaps.release_views.dashboard")
    def test_returns_true_when_revisions_exist(self, mock_dashboard):
        mock_dashboard.snap_release_history.return_value = {
            "revisions": [{"revision": 7}],
        }

        response = self.client.get(self.endpoint_url)

        self.assertEqual(200, response.status_code)
        self.assertEqual({"has_releases": True}, response.get_json())

    @patch("webapp.publisher.snaps.release_views.dashboard")
    def test_returns_false_when_no_revisions(self, mock_dashboard):
        mock_dashboard.snap_release_history.return_value = {"revisions": []}

        response = self.client.get(self.endpoint_url)

        self.assertEqual(200, response.status_code)
        self.assertEqual({"has_releases": False}, response.get_json())

    @patch("webapp.publisher.snaps.release_views.dashboard")
    def test_returns_false_for_empty_list_response(self, mock_dashboard):
        # Some older mocks/tests model the response as a bare list.
        mock_dashboard.snap_release_history.return_value = []

        response = self.client.get(self.endpoint_url)

        self.assertEqual(200, response.status_code)
        self.assertEqual({"has_releases": False}, response.get_json())

    @patch("webapp.publisher.snaps.release_views.dashboard")
    def test_404_when_snap_does_not_exist(self, mock_dashboard):
        error = StoreApiResponseErrorList(
            "not found", 404, [{"message": "no snap"}]
        )
        mock_dashboard.snap_release_history.side_effect = error

        response = self.client.get(self.endpoint_url)

        self.assertEqual(404, response.status_code)
