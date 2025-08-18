from unittest.mock import patch
from requests.exceptions import HTTPError
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


class TestPostBuild(TestEndpoints):
    def setUp(self):
        super().setUp()
        self.snap_name = "test-snap"
        self.endpoint_url = f"/api/{self.snap_name}/builds/trigger-build"

    @patch("webapp.endpoints.publisher.builds.launchpad")
    @patch("webapp.endpoints.publisher.builds.dashboard")
    def test_post_build_success(self, mock_dashboard, mock_launchpad):
        """Test successful build trigger"""
        # Mock account snaps to include our test snap
        mock_dashboard.get_account_snaps.return_value = {
            self.snap_name: {"snap_name": self.snap_name}
        }

        # Mock launchpad methods
        mock_launchpad.is_snap_building.return_value = False
        mock_launchpad.build_snap.return_value = "build-12345"

        response = self.client.post(self.endpoint_url)

        # Assert response
        self.assertEqual(response.status_code, 200)
        response_data = response.get_json()
        self.assertTrue(response_data["success"])
        self.assertEqual(response_data["build_id"], "build-12345")

        # Verify method calls
        mock_dashboard.get_account_snaps.assert_called_once()
        mock_launchpad.is_snap_building.assert_called_once_with(self.snap_name)
        mock_launchpad.build_snap.assert_called_once_with(self.snap_name)

    @patch("webapp.endpoints.publisher.builds.launchpad")
    @patch("webapp.endpoints.publisher.builds.dashboard")
    def test_post_build_cancels_existing_build(
        self, mock_dashboard, mock_launchpad
    ):
        """Test that existing builds are cancelled before starting new one"""
        # Mock account snaps to include our test snap
        mock_dashboard.get_account_snaps.return_value = {
            self.snap_name: {"snap_name": self.snap_name}
        }

        # Mock launchpad methods - existing build is running
        mock_launchpad.is_snap_building.return_value = True
        mock_launchpad.build_snap.return_value = "build-12345"

        response = self.client.post(self.endpoint_url)

        # Assert response
        self.assertEqual(response.status_code, 200)
        response_data = response.get_json()
        self.assertTrue(response_data["success"])
        self.assertEqual(response_data["build_id"], "build-12345")

        # Verify existing build was cancelled
        mock_launchpad.is_snap_building.assert_called_once_with(self.snap_name)
        mock_launchpad.cancel_snap_builds.assert_called_once_with(
            self.snap_name
        )
        mock_launchpad.build_snap.assert_called_once_with(self.snap_name)

    @patch("webapp.endpoints.publisher.builds.dashboard")
    def test_post_build_forbidden_non_contributor(self, mock_dashboard):
        """Test that non-contributors cannot trigger builds"""
        # Mock account snaps to NOT include our test snap
        mock_dashboard.get_account_snaps.return_value = {}

        response = self.client.post(self.endpoint_url)

        # Assert response
        self.assertEqual(response.status_code, 200)
        response_data = response.get_json()
        self.assertFalse(response_data["success"])
        self.assertEqual(response_data["error"]["type"], "FORBIDDEN")
        self.assertIn(
            "not allowed to request builds", response_data["error"]["message"]
        )

    @patch("webapp.endpoints.publisher.builds.launchpad")
    @patch("webapp.endpoints.publisher.builds.dashboard")
    def test_post_build_http_error(self, mock_dashboard, mock_launchpad):
        """Test handling of HTTP errors from Launchpad"""
        from unittest.mock import Mock

        # Mock account snaps to include our test snap
        mock_dashboard.get_account_snaps.return_value = {
            self.snap_name: {"snap_name": self.snap_name}
        }

        # Mock launchpad methods
        mock_launchpad.is_snap_building.return_value = False

        # Create mock HTTP error
        mock_response = Mock()
        mock_response.text = "Launchpad error message"
        mock_response.status_code = 500
        http_error = HTTPError()
        http_error.response = mock_response
        mock_launchpad.build_snap.side_effect = http_error

        response = self.client.post(self.endpoint_url)

        # Assert response
        self.assertEqual(response.status_code, 200)
        response_data = response.get_json()
        self.assertFalse(response_data["success"])
        self.assertIn(
            "error happened building", response_data["error"]["message"]
        )
        self.assertEqual(response_data["details"], "Launchpad error message")
        self.assertEqual(response_data["status_code"], 500)

    def test_post_build_requires_login(self):
        """Test that the endpoint requires login"""
        # Create a new client without logging in
        app = self.app
        client = app.test_client()

        response = client.post(self.endpoint_url)

        # Should redirect to login or return unauthorized
        # The exact behavior depends on the login_required decorator
        self.assertIn(response.status_code, [302, 401, 403])


class TestPostDisconnectRepo(TestEndpoints):
    def setUp(self):
        super().setUp()
        self.snap_name = "test-snap"
        self.endpoint_url = f"/api/{self.snap_name}/builds/disconnect/"

    def test_post_disconnect_repo_requires_login(self):
        """Test that the endpoint requires login"""
        # Create a new client without logging in
        app = self.app
        client = app.test_client()

        response = client.post(self.endpoint_url)

        # Should redirect to login or return unauthorized
        # The exact behavior depends on the login_required decorator
        self.assertIn(response.status_code, [302, 401, 403])
