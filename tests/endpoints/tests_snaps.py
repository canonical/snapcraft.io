from unittest.mock import patch
from tests.endpoints.endpoint_testing import TestEndpoints


class TestGetStoreSnaps(TestEndpoints):
    @patch("canonicalwebteam.store_api.dashboard.Dashboard.get_store_snaps")
    @patch("canonicalwebteam.store_api.dashboard.Dashboard.get_store")
    def test_get_store_snaps_without_whitelist(
        self, mock_get_store, mock_get_store_snaps
    ):
        """Test getting store snaps when store has no whitelist"""
        mock_store = {"id": "test-store-id", "name": "Test Store"}
        mock_get_store.return_value = mock_store

        mock_snaps = [
            {"snap-id": "snap1", "name": "test-snap-1"},
            {"snap-id": "snap2", "name": "test-snap-2"},
        ]
        mock_get_store_snaps.return_value = mock_snaps

        response = self.client.get("/api/store/test-store-id/snaps")
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data, mock_snaps)

    @patch("canonicalwebteam.store_api.dashboard.Dashboard.get_store_snaps")
    @patch("canonicalwebteam.store_api.dashboard.Dashboard.get_store")
    def test_get_store_snaps_with_whitelist(
        self, mock_get_store, mock_get_store_snaps
    ):
        """Test getting store snaps when store has whitelist with accessible
        stores"""
        mock_store = {
            "id": "test-store-id",
            "name": "Test Store",
            "store-whitelist": ["included-store-1", "included-store-2"],
        }
        mock_get_store.side_effect = [
            mock_store,
            {"id": "included-store-1", "name": "Included Store 1"},
            {"id": "included-store-2", "name": "Included Store 2"},
        ]

        mock_snaps = [{"snap-id": "snap1", "name": "test-snap-1"}]
        mock_get_store_snaps.return_value = mock_snaps

        response = self.client.get("/api/store/test-store-id/snaps")
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0], mock_snaps[0])

        included_stores_data = data[1]
        self.assertIn("included-stores", included_stores_data)
        included_stores = included_stores_data["included-stores"]
        self.assertEqual(len(included_stores), 2)

        self.assertEqual(included_stores[0]["id"], "included-store-1")
        self.assertEqual(included_stores[0]["name"], "Included Store 1")
        self.assertTrue(included_stores[0]["userHasAccess"])

        self.assertEqual(included_stores[1]["id"], "included-store-2")
        self.assertEqual(included_stores[1]["name"], "Included Store 2")
        self.assertTrue(included_stores[1]["userHasAccess"])
