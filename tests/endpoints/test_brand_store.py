from unittest.mock import patch
from canonicalwebteam.exceptions import StoreApiResponseErrorList

from tests.endpoints.endpoint_testing import TestModelServiceEndpoints


class TestGetBrandStoreEndpoint(TestModelServiceEndpoints):
    @patch("canonicalwebteam.store_api.publishergw.PublisherGW.get_brand")
    def test_successful_get_brand_store(self, mock_get_brand):
        mock_get_brand.return_value = {"name": "BrandName"}

        response = self.client.get("/api/store/1/brand")
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertEqual(data["data"], {"name": "BrandName"})

    @patch("canonicalwebteam.store_api.publishergw.PublisherGW.get_brand")
    def test_failed_get_brand_store(self, mock_get_brand):
        mock_get_brand.side_effect = StoreApiResponseErrorList(
            "error", 400, [{"message": "error"}]
        )

        response = self.client.get("/api/store/1/brand")
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "error")
