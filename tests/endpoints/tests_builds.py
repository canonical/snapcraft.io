from unittest.mock import patch, MagicMock
from tests.endpoints.endpoint_testing import TestEndpoints


class TestGetSnapRepo(TestEndpoints):
    def setUp(self):
        super().setUp()
        self.snap_name = "test-snap"
        self.endpoint_url = f"/api/{self.snap_name}/repo"

    @patch("webapp.endpoints.builds.GitHub")
    @patch("webapp.endpoints.builds.launchpad")
    @patch("webapp.endpoints.builds.dashboard")
    def test_get_snap_repo_with_existing_lp_snap_success(
        self, mock_dashboard, mock_launchpad, mock_github_class
    ):
        """Test get_snap_repo when snap exists in Launchpad and GitHub
        repo is accessible"""
        # Mock dashboard responses
        mock_snap_info = {"snap_name": self.snap_name}
        mock_dashboard.get_snap_info.return_value = mock_snap_info
        mock_dashboard.get_package_upload_macaroon.return_value = None

        # Mock Launchpad response
        mock_lp_snap = {
            "git_repository_url": "https://github.com/test-owner/test-repo"
        }
        mock_launchpad.get_snap_by_store_name.return_value = mock_lp_snap

        # Mock GitHub responses
        mock_github = MagicMock()
        mock_github.check_if_repo_exists.return_value = True
        mock_github.get_user.return_value = {"login": "test-user"}
        mock_github.get_orgs.return_value = [{"login": "test-org"}]
        mock_github_class.return_value = mock_github

        response = self.client.get(self.endpoint_url)
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertEqual(data["message"], "")
        self.assertEqual(
            data["data"]["github_repository"], "test-owner/test-repo"
        )
        self.assertEqual(data["data"]["github_user"], {"login": "test-user"})
        self.assertEqual(data["data"]["github_orgs"], [{"login": "test-org"}])

        # Verify dashboard methods were called
        mock_dashboard.get_snap_info.assert_called_once()
        mock_dashboard.get_package_upload_macaroon.assert_called_once()

    @patch("webapp.endpoints.builds.GitHub")
    @patch("webapp.endpoints.builds.launchpad")
    @patch("webapp.endpoints.builds.dashboard")
    def test_get_snap_repo_with_revoked_github_access(
        self, mock_dashboard, mock_launchpad, mock_github_class
    ):
        """Test get_snap_repo when GitHub repo access has been revoked"""
        # Mock dashboard responses
        mock_snap_info = {"snap_name": self.snap_name}
        mock_dashboard.get_snap_info.return_value = mock_snap_info
        mock_dashboard.get_package_upload_macaroon.return_value = None

        # Mock Launchpad response
        mock_lp_snap = {
            "git_repository_url": "https://github.com/test-owner/test-repo"
        }
        mock_launchpad.get_snap_by_store_name.return_value = mock_lp_snap

        # Mock GitHub responses - repo doesn't exist (revoked access)
        mock_github = MagicMock()
        mock_github.check_if_repo_exists.return_value = False
        mock_github.get_user.return_value = {"login": "test-user"}
        mock_github.get_orgs.return_value = [{"login": "test-org"}]
        mock_github_class.return_value = mock_github

        response = self.client.get(self.endpoint_url)
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertFalse(data["data"]["success"])
        self.assertEqual(data["data"]["message"], "This app has been revoked")
        self.assertEqual(
            data["data"]["github_repository"], "test-owner/test-repo"
        )

    @patch("webapp.endpoints.builds.GitHub")
    @patch("webapp.endpoints.builds.launchpad")
    @patch("webapp.endpoints.builds.dashboard")
    def test_get_snap_repo_without_lp_snap_authorized(
        self, mock_dashboard, mock_launchpad, mock_github_class
    ):
        """Test get_snap_repo when no Launchpad snap exists but user is
        authorized"""
        # Mock dashboard responses
        mock_snap_info = {"snap_name": self.snap_name}
        mock_dashboard.get_snap_info.return_value = mock_snap_info
        mock_dashboard.get_package_upload_macaroon.return_value = None

        # Mock Launchpad response - no snap found
        mock_launchpad.get_snap_by_store_name.return_value = None

        # Mock GitHub responses
        mock_github = MagicMock()
        mock_github.get_user.return_value = {"login": "test-user"}
        mock_github.get_orgs.return_value = [{"login": "test-org"}]
        mock_github_class.return_value = mock_github

        response = self.client.get(self.endpoint_url)
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertEqual(data["message"], "")
        self.assertIsNone(data["data"]["github_repository"])
        self.assertEqual(data["data"]["github_user"], {"login": "test-user"})
        self.assertEqual(data["data"]["github_orgs"], [{"login": "test-org"}])

    @patch("webapp.endpoints.builds.GitHub")
    @patch("webapp.endpoints.builds.launchpad")
    @patch("webapp.endpoints.builds.dashboard")
    def test_get_snap_repo_without_lp_snap_unauthorized(
        self, mock_dashboard, mock_launchpad, mock_github_class
    ):
        """Test get_snap_repo when no Launchpad snap exists and user is
        unauthorized"""
        # Mock dashboard responses
        mock_snap_info = {"snap_name": self.snap_name}
        mock_dashboard.get_snap_info.return_value = mock_snap_info
        mock_dashboard.get_package_upload_macaroon.return_value = None

        # Mock Launchpad response - no snap found
        mock_launchpad.get_snap_by_store_name.return_value = None

        # Mock GitHub responses - no user (unauthorized)
        mock_github = MagicMock()
        mock_github.get_user.return_value = None
        mock_github_class.return_value = mock_github

        response = self.client.get(self.endpoint_url)
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertFalse(data["data"]["success"])
        self.assertEqual(data["data"]["message"], "Unauthorized")
        self.assertIsNone(data["data"]["github_repository"])

    @patch(
        "webapp.endpoints.builds.GITHUB_SNAPCRAFT_USER_TOKEN", "fallback-token"
    )
    @patch("webapp.endpoints.builds.GitHub")
    @patch("webapp.endpoints.builds.launchpad")
    @patch("webapp.endpoints.builds.dashboard")
    def test_get_snap_repo_uses_fallback_token_when_no_session_token(
        self, mock_dashboard, mock_launchpad, mock_github_class
    ):
        """Test get_snap_repo uses fallback token when no GitHub token
        in session"""
        # Mock dashboard responses
        mock_snap_info = {"snap_name": self.snap_name}
        mock_dashboard.get_snap_info.return_value = mock_snap_info
        mock_dashboard.get_package_upload_macaroon.return_value = None

        # Mock Launchpad response
        mock_lp_snap = {
            "git_repository_url": "https://github.com/test-owner/test-repo"
        }
        mock_launchpad.get_snap_by_store_name.return_value = mock_lp_snap

        # Mock GitHub responses
        mock_github = MagicMock()
        mock_github.check_if_repo_exists.return_value = True
        mock_github.get_user.return_value = {"login": "snapcraft-user"}
        mock_github.get_orgs.return_value = []
        mock_github_class.return_value = mock_github

        # Clear GitHub token from session
        with self.client.session_transaction() as session:
            session.pop("github_auth_secret", None)

        response = self.client.get(self.endpoint_url)
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])

        # Verify GitHub was initialized with fallback token
        mock_github_class.assert_called_with("fallback-token")
