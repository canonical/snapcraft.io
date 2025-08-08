from unittest.mock import patch
from tests.endpoints.endpoint_testing import TestEndpoints


class TestGetSnapBuildPage(TestEndpoints):
    def setUp(self):
        super().setUp()
        self.snap_name = "test-snap"
        self.build_id = "12345"
        self.endpoint_url = f"/{self.snap_name}/builds/{self.build_id}"

    @patch("webapp.endpoints.publisher.builds.dashboard")
    def test_get_snap_build_page_success(self, mock_dashboard):
        """Test successful rendering of snap build page"""
        # Mock snap info response
        mock_snap_info = {
            "snap_name": self.snap_name,
            "title": "Test Snap",
            "snap_id": "test-snap-id-123",
        }
        mock_dashboard.get_snap_info.return_value = mock_snap_info

        response = self.client.get(self.endpoint_url)

        # Assert response
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"text/html", response.content_type.encode())

        # Verify dashboard method was called with correct session and snap name
        mock_dashboard.get_snap_info.assert_called_once()
        call_args = mock_dashboard.get_snap_info.call_args
        self.assertEqual(call_args[0][1], self.snap_name)

    def test_get_snap_build_page_requires_login(self):
        """Test that the endpoint requires login"""
        # Create a new client without logging in
        app = self.app
        client = app.test_client()

        response = client.get(self.endpoint_url)

        # Should redirect to login or return unauthorized
        # The exact behavior depends on the login_required decorator
        self.assertIn(response.status_code, [302, 401, 403])
