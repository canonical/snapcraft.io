from unittest.mock import patch
from tests.endpoints.endpoint_testing import TestEndpoints


class TestGetReleaseHistoryData(TestEndpoints):
    @patch("webapp.endpoints.releases.dashboard.snap_channel_map")
    @patch("webapp.endpoints.releases.dashboard.snap_release_history")
    def test_get_release_history_data_success(
        self, mock_snap_release_history, mock_snap_channel_map
    ):
        """Test successful retrieval of release history data"""
        snap_name = "test-snap"

        # Mock release history response
        mock_release_history = [
            {
                "revision": 1,
                "version": "1.0",
                "created_at": "2023-01-01T00:00:00Z",
                "architectures": ["amd64"],
                "channels": ["stable"],
            }
        ]
        mock_snap_release_history.return_value = mock_release_history

        # Mock channel map response
        mock_channel_map_data = {
            "snap": {
                "title": "Test Snap",
                "private": False,
                "default-track": "latest",
                "tracks": [{"name": "latest"}],
                "publisher": {"display-name": "Test Publisher"},
            },
            "channel-map": [
                {"channel": "stable", "revision": 1, "version": "1.0"}
            ],
        }
        mock_snap_channel_map.return_value = mock_channel_map_data

        response = self.client.get(f"/api/{snap_name}/releases")
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertIn("data", data)

        context = data["data"]
        self.assertEqual(context["snap_name"], snap_name)
        self.assertEqual(context["snap_title"], "Test Snap")
        self.assertEqual(context["publisher_name"], "Test Publisher")
        self.assertEqual(context["release_history"], mock_release_history)
        self.assertFalse(context["private"])
        self.assertEqual(context["default_track"], "latest")
        self.assertEqual(
            context["channel_map"], mock_channel_map_data["channel-map"]
        )
        self.assertEqual(
            context["tracks"], mock_channel_map_data["snap"]["tracks"]
        )

        # Verify the dashboard methods were called with correct parameters
        mock_snap_release_history.assert_called_once()
        mock_snap_channel_map.assert_called_once()

    @patch("webapp.endpoints.releases.dashboard.snap_channel_map")
    @patch("webapp.endpoints.releases.dashboard.snap_release_history")
    def test_get_release_history_data_default_track_none(
        self, mock_snap_release_history, mock_snap_channel_map
    ):
        """Test that default track defaults to 'latest' when None"""
        snap_name = "test-snap"

        mock_snap_release_history.return_value = []

        # Mock channel map with default-track as None
        mock_channel_map_data = {
            "snap": {
                "title": "Test Snap",
                "private": False,
                "default-track": None,  # This should default to "latest"
                "tracks": [],
                "publisher": {"display-name": "Test Publisher"},
            },
            "channel-map": [],
        }
        mock_snap_channel_map.return_value = mock_channel_map_data

        response = self.client.get(f"/api/{snap_name}/releases")
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        context = data["data"]
        self.assertEqual(context["default_track"], "latest")

    @patch("webapp.endpoints.releases.dashboard.snap_channel_map")
    @patch("webapp.endpoints.releases.dashboard.snap_release_history")
    def test_get_release_history_data_empty_snap(
        self, mock_snap_release_history, mock_snap_channel_map
    ):
        """Test handling of empty snap data"""
        snap_name = "test-snap"

        mock_snap_release_history.return_value = []

        # Mock channel map with empty snap data
        mock_channel_map_data = {
            "snap": {},  # Empty snap data
            "channel-map": [],
        }
        mock_snap_channel_map.return_value = mock_channel_map_data

        response = self.client.get(f"/api/{snap_name}/releases")
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        context = data["data"]
        self.assertEqual(context["snap_name"], snap_name)
        self.assertIsNone(context["snap_title"])
        # Empty dict for missing publisher
        self.assertEqual(context["publisher_name"], {})
        # Should default to latest
        self.assertEqual(context["default_track"], "latest")
        self.assertIsNone(context["private"])
        self.assertIsNone(context["tracks"])
