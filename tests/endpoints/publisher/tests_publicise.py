from unittest.mock import patch
from canonicalwebteam.exceptions import StoreApiError
from tests.endpoints.endpoint_testing import TestEndpoints


class TestGetPubliciseData(TestEndpoints):
    @patch("webapp.endpoints.publisher.publicise.device_gateway")
    @patch("webapp.endpoints.publisher.publicise.dashboard")
    def test_get_publicise_data_success_with_trending(
        self, mock_dashboard, mock_device_gateway
    ):
        # Mock the snap details returned by the dashboard
        mock_snap_details = {
            "snap_name": "test-snap",
            "private": False,
            "channel_maps_list": [
                {
                    "channel": {
                        "name": "stable",
                        "track": "latest",
                        "risk": "stable",
                    }
                }
            ],
        }
        mock_dashboard.get_snap_info.return_value = mock_snap_details

        # Mock device gateway response with trending
        mock_public_details = {"snap": {"trending": True}}
        mock_device_gateway.get_item_details.return_value = mock_public_details

        # Make the request
        response = self.client.get("/api/test-snap/publicise")
        data = response.json

        # Assert response structure
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertIn("data", data)

        # Assert data content
        response_data = data["data"]
        self.assertTrue(response_data["is_released"])
        self.assertTrue(response_data["trending"])
        self.assertFalse(response_data["private"])

        # Verify mocks were called correctly
        mock_dashboard.get_snap_info.assert_called_once()
        mock_device_gateway.get_item_details.assert_called_once_with(
            "test-snap", api_version=2, fields=["trending", "private"]
        )

    @patch("webapp.endpoints.publisher.publicise.device_gateway")
    @patch("webapp.endpoints.publisher.publicise.dashboard")
    def test_get_publicise_data_success_without_trending(
        self, mock_dashboard, mock_device_gateway
    ):
        # Mock the snap details returned by the dashboard
        mock_snap_details = {
            "snap_name": "test-snap",
            "private": True,
            "channel_maps_list": [],  # Empty list means not released
        }
        mock_dashboard.get_snap_info.return_value = mock_snap_details

        # Mock device gateway to raise StoreApiError
        mock_device_gateway.get_item_details.side_effect = StoreApiError(
            "API Error", 500
        )

        # Make the request
        response = self.client.get("/api/test-snap/publicise")
        data = response.json

        # Assert response structure
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertIn("data", data)

        # Assert data content
        response_data = data["data"]
        # Empty channel_maps_list means not released
        self.assertFalse(response_data["is_released"])
        self.assertFalse(response_data["trending"])  # Default when API fails
        self.assertTrue(response_data["private"])

        # Verify mocks were called correctly
        mock_dashboard.get_snap_info.assert_called_once()
        mock_device_gateway.get_item_details.assert_called_once_with(
            "test-snap", api_version=2, fields=["trending", "private"]
        )

    @patch("webapp.endpoints.publisher.publicise.device_gateway")
    @patch("webapp.endpoints.publisher.publicise.dashboard")
    def test_get_publicise_data_released_snap(
        self, mock_dashboard, mock_device_gateway
    ):
        # Mock the snap details with multiple channels
        mock_snap_details = {
            "snap_name": "test-snap",
            "private": False,
            "channel_maps_list": [
                {"channel": {"name": "stable"}},
                {"channel": {"name": "beta"}},
                {"channel": {"name": "edge"}},
            ],
        }
        mock_dashboard.get_snap_info.return_value = mock_snap_details

        # Mock device gateway response
        mock_public_details = {"snap": {"trending": False}}
        mock_device_gateway.get_item_details.return_value = mock_public_details

        # Make the request
        response = self.client.get("/api/test-snap/publicise")
        data = response.json

        # Assert response
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])

        response_data = data["data"]
        self.assertTrue(response_data["is_released"])  # Has channels
        self.assertFalse(response_data["trending"])
        self.assertFalse(response_data["private"])

    @patch("webapp.endpoints.publisher.publicise.device_gateway")
    @patch("webapp.endpoints.publisher.publicise.dashboard")
    def test_get_publicise_data_private_snap(
        self, mock_dashboard, mock_device_gateway
    ):
        # Mock private snap details
        mock_snap_details = {
            "snap_name": "private-snap",
            "private": True,
            "channel_maps_list": [{"channel": {"name": "stable"}}],
        }
        mock_dashboard.get_snap_info.return_value = mock_snap_details

        # Mock device gateway response
        mock_public_details = {"snap": {"trending": True}}
        mock_device_gateway.get_item_details.return_value = mock_public_details

        # Make the request
        response = self.client.get("/api/private-snap/publicise")
        data = response.json

        # Assert response
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])

        response_data = data["data"]
        self.assertTrue(response_data["is_released"])
        self.assertTrue(response_data["trending"])
        self.assertTrue(response_data["private"])
