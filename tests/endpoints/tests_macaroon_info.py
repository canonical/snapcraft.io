from unittest.mock import patch

from tests.endpoints.endpoint_testing import TestEndpoints


class TestMacaroonInfo(TestEndpoints):
    @patch("canonicalwebteam.store_api.publishergw.PublisherGW.macaroon_info")
    def test_get_macaroon_info(self, mock_macaroon_info):
        mock_macaroon_info.return_value = {
            "account-id": "test-account-id",
            "permissions": ["package_access"],
        }

        response = self.client.get("/api/whoami")
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertEqual(
            data["data"],
            {
                "account-id": "test-account-id",
                "permissions": ["package_access"],
            },
        )
        mock_macaroon_info.assert_called_once_with("test_macaroon")
