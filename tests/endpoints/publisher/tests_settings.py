from unittest.mock import patch, Mock
from tests.endpoints.endpoint_testing import TestEndpoints


class TestGetSettingsData(TestEndpoints):
    @patch("webapp.helpers.launchpad.get_snap_by_store_name")
    @patch("canonicalwebteam.store_api.dashboard.Dashboard.get_snap_info")
    def test_get_settings_data_success(
        self, mock_get_snap_info, mock_get_snap_by_store_name
    ):
        # Mock the snap details returned by the dashboard
        mock_snap_details = {
            "snap_name": "test-snap",
            "title": "Test Snap",
            "snap_id": "test-snap-id-123",
            "publisher": {"display-name": "Test Publisher"},
            "license": "MIT",
            "private": False,
            "unlisted": False,
            "store": "ubuntu",
            "keywords": ["test", "snap"],
            "status": "Published",
            "update_metadata_on_release": True,
            "visibility_locked": False,
            "whitelist_country_codes": ["US", "GB"],
            "blacklist_country_codes": ["XX"],
        }
        mock_get_snap_info.return_value = mock_snap_details

        # Mock launchpad response
        mock_lp_snap = Mock()
        mock_get_snap_by_store_name.return_value = mock_lp_snap

        # Make the request
        response = self.client.get("/api/test-snap/settings")
        data = response.json

        # Assert response structure
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertIn("data", data)

        # Assert data content
        response_data = data["data"]
        self.assertEqual(response_data["snap_name"], "test-snap")
        self.assertEqual(response_data["snap_title"], "Test Snap")
        self.assertEqual(response_data["snap_id"], "test-snap-id-123")
        self.assertEqual(response_data["publisher_name"], "Test Publisher")
        self.assertEqual(response_data["license"], "MIT")
        self.assertFalse(response_data["private"])
        self.assertFalse(response_data["unlisted"])
        self.assertEqual(response_data["store"], "ubuntu")
        self.assertEqual(response_data["keywords"], ["test", "snap"])
        self.assertEqual(response_data["status"], "Published")
        self.assertTrue(response_data["update_metadata_on_release"])
        self.assertFalse(response_data["visibility_locked"])
        self.assertTrue(response_data["is_on_lp"])

        # Assert country codes
        self.assertEqual(response_data["whitelist_countries"], ["US", "GB"])
        self.assertEqual(response_data["blacklist_countries"], ["XX"])

        # Assert countries list is populated
        self.assertIn("countries", response_data)
        self.assertIsInstance(response_data["countries"], list)
        self.assertTrue(len(response_data["countries"]) > 0)

        # Check that each country has the expected structure
        country = response_data["countries"][0]
        self.assertIn("key", country)
        self.assertIn("name", country)

    @patch("webapp.helpers.launchpad.get_snap_by_store_name")
    @patch("canonicalwebteam.store_api.dashboard.Dashboard.get_snap_info")
    def test_get_settings_data_no_country_codes(
        self, mock_get_snap_info, mock_get_snap_by_store_name
    ):
        # Mock snap details without country codes
        mock_snap_details = {
            "snap_name": "test-snap",
            "title": "Test Snap",
            "snap_id": "test-snap-id-123",
            "publisher": {"display-name": "Test Publisher"},
            "license": "MIT",
            "private": False,
            "unlisted": False,
            "store": "ubuntu",
            "keywords": ["test", "snap"],
            "status": "Published",
            "update_metadata_on_release": True,
            "visibility_locked": False,
        }
        mock_get_snap_info.return_value = mock_snap_details

        # Mock launchpad response - no snap found
        mock_get_snap_by_store_name.return_value = None

        # Make the request
        response = self.client.get("/api/test-snap/settings")
        data = response.json

        # Assert response
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])

        response_data = data["data"]
        self.assertEqual(response_data["whitelist_countries"], [])
        self.assertEqual(response_data["blacklist_countries"], [])
        self.assertFalse(response_data["is_on_lp"])

    @patch("webapp.helpers.launchpad.get_snap_by_store_name")
    @patch("canonicalwebteam.store_api.dashboard.Dashboard.get_snap_info")
    def test_get_settings_data_empty_country_codes(
        self, mock_get_snap_info, mock_get_snap_by_store_name
    ):
        # Mock snap details with empty country codes
        mock_snap_details = {
            "snap_name": "test-snap",
            "title": "Test Snap",
            "snap_id": "test-snap-id-123",
            "publisher": {"display-name": "Test Publisher"},
            "license": "MIT",
            "private": False,
            "unlisted": False,
            "store": "ubuntu",
            "keywords": ["test", "snap"],
            "status": "Published",
            "update_metadata_on_release": True,
            "visibility_locked": False,
            "whitelist_country_codes": [],
            "blacklist_country_codes": [],
        }
        mock_get_snap_info.return_value = mock_snap_details

        # Mock launchpad response
        mock_get_snap_by_store_name.return_value = None

        # Make the request
        response = self.client.get("/api/test-snap/settings")
        data = response.json

        # Assert response
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])

        response_data = data["data"]
        self.assertEqual(response_data["whitelist_countries"], [])
        self.assertEqual(response_data["blacklist_countries"], [])

    @patch("webapp.helpers.launchpad.get_snap_by_store_name")
    @patch("canonicalwebteam.store_api.dashboard.Dashboard.get_snap_info")
    def test_get_settings_data_visibility_locked_true(
        self, mock_get_snap_info, mock_get_snap_by_store_name
    ):
        # Mock snap details with visibility_locked as True
        mock_snap_details = {
            "snap_name": "test-snap",
            "title": "Test Snap",
            "snap_id": "test-snap-id-123",
            "publisher": {"display-name": "Test Publisher"},
            "license": "MIT",
            "private": False,
            "unlisted": False,
            "store": "ubuntu",
            "keywords": ["test", "snap"],
            "status": "Published",
            "update_metadata_on_release": True,
            "visibility_locked": True,
        }
        mock_get_snap_info.return_value = mock_snap_details
        mock_get_snap_by_store_name.return_value = None

        # Make the request
        response = self.client.get("/api/test-snap/settings")
        data = response.json

        # Assert response
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])

        response_data = data["data"]
        self.assertTrue(response_data["visibility_locked"])
