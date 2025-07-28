from unittest.mock import patch

from tests.endpoints.endpoint_testing import TestEndpoints


class TestGetStores(TestEndpoints):
    @patch("canonicalwebteam.store_api.dashboard.Dashboard.get_stores")
    def test_get_stores(self, mock_get_stores):
        mock_get_stores.return_value = [
            {"id": "ubuntu", "name": "Global", "roles": ["view", "access"]},
            {
                "id": "test-store",
                "name": "Test Store",
                "roles": ["admin", "review", "view", "access"],
            },
        ]

        response = self.client.get("/api/stores")
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertEqual(
            data["data"],
            [
                {
                    "id": "ubuntu",
                    "name": "Global",
                    "roles": ["view", "access"],
                },
                {
                    "id": "test-store",
                    "name": "Test Store",
                    "roles": ["admin", "review", "view", "access"],
                },
            ],
        )
