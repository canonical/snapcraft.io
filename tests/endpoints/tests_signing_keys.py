from unittest.mock import patch, Mock
from tests.admin.tests_models import TestModelServiceEndpoints
from canonicalwebteam.exceptions import StoreApiResponseErrorList


class TestGetSigningKeys(TestModelServiceEndpoints):
    @patch(
        "canonicalwebteam.store_api.dashboard.Dashboard.get_store",
        Mock(return_value={"brand-id": "BrandName"}),
    )
    @patch(
        "canonicalwebteam.store_api.publishergw."
        "PublisherGW.get_store_signing_keys"
    )
    def test_get_signing_keys(self, mock_get_store_signing_keys):
        mock_get_store_signing_keys.return_value = [
            {"sha3-384": "key1"},
            {"sha3-384": "key2"},
        ]

        response = self.client.get("/api/store/1/signing-keys")
        data = response.json

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertEqual(
            data["data"],
            [{"sha3-384": "key1"}, {"sha3-384": "key2"}],
        )

    @patch(
        "canonicalwebteam.store_api.dashboard.Dashboard.get_store",
        Mock(return_value={"brand-id": "BrandName"}),
    )
    @patch(
        "canonicalwebteam.store_api.publishergw."
        "PublisherGW.get_store_signing_keys"
    )
    def test_failed_get_signing_keys(self, mock_get_store_signing_keys):
        mock_get_store_signing_keys.side_effect = StoreApiResponseErrorList(
            "error", 502, [{"message": "An error occurred"}]
        )

        response = self.client.get("/api/store/1/signing-keys")
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "An error occurred")
