from unittest.mock import patch
from canonicalwebteam.exceptions import StoreApiResourceNotFound
from tests.endpoints.endpoint_testing import TestEndpoints


class TestGetPackageMetadata(TestEndpoints):
    @patch("webapp.endpoints.publisher.packages.publisher_gateway")
    def test_get_package_metadata_success(self, mock_publisher_gateway):
        # Mock successful response from publisher gateway
        mock_package_metadata = {
            "snap_name": "test-snap",
            "title": "Test Snap",
            "snap_id": "test-snap-id-123",
            "publisher": {"display-name": "Test Publisher"},
            "license": "MIT",
            "private": False,
            "status": "Published",
            "version": "1.0.0",
        }
        mock_publisher_gateway.get_package_metadata.return_value = (
            mock_package_metadata
        )

        # Make the request
        response = self.client.get("/api/packages/test-snap")
        data = response.json

        # Assert response structure
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertIn("data", data)
        self.assertEqual(data["data"], mock_package_metadata)

        # Verify the gateway was called with correct parameters
        mock_publisher_gateway.get_package_metadata.assert_called_once()

    @patch("webapp.endpoints.publisher.packages.publisher_gateway")
    def test_get_package_metadata_not_found(self, mock_publisher_gateway):
        # Mock StoreApiResourceNotFound exception
        mock_publisher_gateway.get_package_metadata.side_effect = (
            StoreApiResourceNotFound()
        )

        # Make the request
        response = self.client.get("/api/packages/test-snap")
        data = response.json

        # Assert 404 response
        self.assertEqual(response.status_code, 404)
        self.assertFalse(data["success"])
        self.assertEqual(data["error"], "Package not found")
