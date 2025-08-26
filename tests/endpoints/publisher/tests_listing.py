from unittest.mock import patch
from tests.endpoints.endpoint_testing import TestEndpoints


class TestGetListingData(TestEndpoints):
    @patch("webapp.endpoints.publisher.listing.helpers.get_yaml")
    @patch("webapp.endpoints.publisher.listing.helpers.get_licenses")
    @patch("webapp.endpoints.publisher.listing.logic.filter_categories")
    @patch(
        "webapp.endpoints.publisher.listing.logic."
        "replace_reserved_categories_key"
    )
    @patch("webapp.endpoints.publisher.listing.logic.categorise_media")
    @patch("webapp.endpoints.publisher.listing.get_categories")
    @patch("webapp.endpoints.publisher.listing.device_gateway")
    @patch("webapp.endpoints.publisher.listing.dashboard")
    def test_get_listing_data_success(
        self,
        mock_dashboard,
        mock_device_gateway,
        mock_get_categories,
        mock_categorise_media,
        mock_replace_reserved_categories_key,
        mock_filter_categories,
        mock_get_licenses,
        mock_get_yaml,
    ):
        # Mock snap details from dashboard
        mock_snap_details = {
            "title": "Test Snap",
            "summary": "A test snap for testing",
            "description": (
                "This is a test snap used for unit testing purposes"
            ),
            "snap_id": "test-snap-id-123",
            "public_metrics_enabled": True,
            "public_metrics_blacklist": ["install_size"],
            "media": [
                {"type": "icon", "url": "https://example.com/icon.png"},
                {
                    "type": "screenshot",
                    "url": "https://example.com/screenshot.png",
                },
            ],
            "links": {
                "website": ["https://example.com", "https://secondary.com"],
                "contact": ["mailto:contact@example.com"],
                "source": ["https://github.com/example/repo"],
            },
            "license": "MIT",
            "categories": [{"name": "productivity"}, {"name": "utilities"}],
            "video_urls": ["https://example.com/video.mp4"],
            "update_metadata_on_release": True,
        }
        mock_dashboard.get_snap_info.return_value = mock_snap_details

        # Mock device gateway categories
        mock_device_gateway.get_categories.return_value = [
            {"name": "productivity", "slug": "productivity"},
            {"name": "utilities", "slug": "utilities"},
        ]

        # Mock get_categories function
        mock_get_categories.return_value = [
            {"name": "productivity", "slug": "productivity"},
            {"name": "utilities", "slug": "utilities"},
        ]

        # Mock media categorization
        mock_categorise_media.return_value = (
            ["https://example.com/icon.png"],  # icon_urls
            ["https://example.com/screenshot.png"],  # screenshot_urls
            [],  # banner_urls
        )

        # Mock category processing
        mock_replace_reserved_categories_key.return_value = {
            "categories": [{"name": "productivity"}, {"name": "utilities"}]
        }
        mock_filter_categories.return_value = {
            "categories": [{"name": "productivity"}, {"name": "utilities"}]
        }

        # Mock licenses
        mock_get_licenses.return_value = [
            {"licenseId": "MIT", "name": "MIT License"},
            {"licenseId": "Apache-2.0", "name": "Apache License 2.0"},
        ]

        # Mock YAML tour steps
        mock_get_yaml.return_value = [
            {"title": "Welcome", "content": "Welcome to the tour"}
        ]

        # Make the request
        response = self.client.get("/api/test-snap/listing")
        data = response.json

        # Assert response structure
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertEqual(data["message"], "")
        self.assertIn("data", data)

        # Assert specific data fields
        context = data["data"]
        self.assertEqual(context["title"], "Test Snap")
        self.assertEqual(context["summary"], "A test snap for testing")
        self.assertEqual(context["snap_id"], "test-snap-id-123")
        self.assertTrue(context["public_metrics_enabled"])
        self.assertEqual(context["public_metrics_blacklist"], ["install_size"])
        self.assertEqual(context["license"], "MIT")
        self.assertEqual(context["license_type"], "simple")
        self.assertEqual(context["primary_website"], "https://example.com")
        self.assertEqual(context["primary_category"], "productivity")
        self.assertEqual(context["secondary_category"], "utilities")
        self.assertEqual(context["icon_url"], "https://example.com/icon.png")
        self.assertEqual(
            context["video_urls"], "https://example.com/video.mp4"
        )
        self.assertTrue(context["update_metadata_on_release"])

        # Verify mocks were called correctly
        mock_dashboard.get_snap_info.assert_called_once()
        mock_device_gateway.get_categories.assert_called_once()
        mock_categorise_media.assert_called_once()

    @patch("webapp.endpoints.publisher.listing.helpers.get_yaml")
    @patch("webapp.endpoints.publisher.listing.helpers.get_licenses")
    @patch("webapp.endpoints.publisher.listing.logic.filter_categories")
    @patch(
        "webapp.endpoints.publisher.listing.logic."
        "replace_reserved_categories_key"
    )
    @patch("webapp.endpoints.publisher.listing.logic.categorise_media")
    @patch("webapp.endpoints.publisher.listing.get_categories")
    @patch("webapp.endpoints.publisher.listing.device_gateway")
    @patch("webapp.endpoints.publisher.listing.dashboard")
    def test_get_listing_data_minimal_snap_details(
        self,
        mock_dashboard,
        mock_device_gateway,
        mock_get_categories,
        mock_categorise_media,
        mock_replace_reserved_categories_key,
        mock_filter_categories,
        mock_get_licenses,
        mock_get_yaml,
    ):
        # Mock minimal snap details
        mock_snap_details = {
            "title": "Minimal Snap",
            "summary": "Minimal test snap",
            "description": "A minimal snap for testing edge cases",
            "snap_id": "minimal-snap-id",
            "public_metrics_enabled": False,
            "public_metrics_blacklist": [],
            "media": [],
            "links": {},
            "license": "Proprietary",
            "categories": [],
            "video_urls": [],
            "update_metadata_on_release": False,
        }
        mock_dashboard.get_snap_info.return_value = mock_snap_details

        # Mock other dependencies with minimal data
        mock_device_gateway.get_categories.return_value = []
        mock_get_categories.return_value = []
        mock_categorise_media.return_value = ([], [], [])
        mock_replace_reserved_categories_key.return_value = {"categories": []}
        mock_filter_categories.return_value = {"categories": []}
        mock_get_licenses.return_value = []
        mock_get_yaml.return_value = []

        # Make the request
        response = self.client.get("/api/minimal-snap/listing")
        data = response.json

        # Assert response structure
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])

        # Assert minimal data handling
        context = data["data"]
        self.assertEqual(context["title"], "Minimal Snap")
        self.assertEqual(context["primary_website"], "")
        self.assertEqual(context["websites"], [])
        self.assertEqual(context["primary_category"], "")
        self.assertEqual(context["secondary_category"], "")
        self.assertIsNone(context["icon_url"])
        self.assertEqual(context["screenshot_urls"], [])
        self.assertIsNone(context["video_urls"])


class TestPostListingData(TestEndpoints):
    @patch("webapp.endpoints.publisher.listing.dashboard")
    @patch("webapp.endpoints.publisher.listing.logic.filter_changes_data")
    def test_post_listing_data_success_no_changes(
        self,
        mock_filter_changes_data,
        mock_dashboard,
    ):
        """Test POST with no changes returns success"""
        # Make the request with no changes
        response = self.client.post("/api/test-snap/listing")
        data = response.json

        # Assert response
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])

        # Verify no API calls were made since there were no changes
        mock_dashboard.snap_screenshots.assert_not_called()
        mock_dashboard.snap_metadata.assert_not_called()

    @patch("webapp.endpoints.publisher.listing.dashboard")
    @patch("webapp.endpoints.publisher.listing.logic.filter_changes_data")
    @patch(
        "webapp.endpoints.publisher.listing.logic.remove_invalid_characters"
    )
    def test_post_listing_data_success_with_metadata_changes(
        self,
        mock_remove_invalid_characters,
        mock_filter_changes_data,
        mock_dashboard,
    ):
        """Test POST with metadata changes (title, description, etc.)"""
        # Mock the filter_changes_data to return some changes
        mock_filter_changes_data.return_value = {
            "title": "Updated Title",
            "description": "Updated description with some content",
            "summary": "Updated summary",
        }

        # Mock character removal
        mock_remove_invalid_characters.return_value = (
            "Updated description with some content"
        )

        # Prepare form data
        form_data = {
            "changes": (
                '{"title": "Updated Title", '
                '"description": "Updated description"}'
            ),
            "snap_id": "test-snap-id-123",
        }

        # Make the request
        response = self.client.post("/api/test-snap/listing", data=form_data)
        data = response.json

        # Assert response
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])

        # Verify snap_metadata was called with the filtered data
        mock_dashboard.snap_metadata.assert_called_once()
        call_args = mock_dashboard.snap_metadata.call_args
        self.assertEqual(call_args[0][1], "test-snap-id-123")  # snap_id

        # Verify description was processed for invalid characters
        mock_remove_invalid_characters.assert_called_once_with(
            "Updated description with some content"
        )

    @patch("webapp.endpoints.publisher.listing.dashboard")
    @patch("webapp.endpoints.publisher.listing.logic.build_changed_images")
    def test_post_listing_data_success_with_image_changes(
        self,
        mock_build_changed_images,
        mock_dashboard,
    ):
        """Test POST with image changes (icon, screenshots, banner)"""
        # Mock existing screenshots
        mock_dashboard.snap_screenshots.side_effect = [
            # First call for current screenshots
            [{"type": "screenshot", "url": "existing.png"}],
            None,  # Second call for updating screenshots
        ]

        # Mock build_changed_images
        mock_build_changed_images.return_value = (
            [{"type": "icon", "url": "new-icon.png"}],  # images_json
            [],  # images_files
        )

        # Prepare form data with image changes
        form_data = {
            "changes": '{"images": {"icon": "new-icon.png"}}',
            "snap_id": "test-snap-id-456",
        }

        # Make the request
        response = self.client.post("/api/test-snap/listing", data=form_data)
        data = response.json

        # Assert response
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])

        # Verify screenshots were fetched and updated
        self.assertEqual(mock_dashboard.snap_screenshots.call_count, 2)

        # Verify build_changed_images was called
        mock_build_changed_images.assert_called_once()
