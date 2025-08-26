from unittest.mock import patch
from tests.endpoints.endpoint_testing import TestEndpoints


class TestSnapsSearch(TestEndpoints):
    @patch("canonicalwebteam.store_api.dashboard.Dashboard.get_store_snaps")
    def test_get_snaps_search(self, mock_get_store_snaps):
        """Test basic functionality of get_snaps_search endpoint"""

        test_snaps = {
            "snaps": [
                {
                    "name": "test-snap-1",
                    "id": "snap-1-id",
                    "title": "Test Snap 1",
                    "summary": "A test snap for testing",
                },
                {
                    "name": "test-snap-2",
                    "id": "snap-2-id",
                    "title": "Test Snap 2",
                    "summary": "Another test snap",
                },
            ],
            "total": 2,
        }

        mock_get_store_snaps.return_value = test_snaps

        response = self.client.get("/api/test-store-id/snaps/search")
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data, test_snaps)

    @patch("canonicalwebteam.store_api.dashboard.Dashboard.get_store_snaps")
    def test_get_snaps_search_with_query_params(self, mock_get_store_snaps):
        test_snaps = {
            "snaps": [
                {
                    "name": "filtered-snap",
                    "id": "filtered-snap-id",
                    "title": "Filtered Snap",
                    "summary": "A filtered snap",
                }
            ],
            "total": 1,
        }

        mock_get_store_snaps.return_value = test_snaps

        response = self.client.get(
            (
                "/api/test-store-id/snaps/search"
                "?q=test-query&allowed_for_inclusion=true"
            )
        )
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data, test_snaps)
