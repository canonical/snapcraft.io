import unittest
from unittest.mock import patch, MagicMock

from webapp.app import create_app
from webapp.publisher.snaps.builds import map_build_and_upload_states
from webapp.publisher.snaps.build_views import (
    extract_github_repository,
    get_builds,
)


class TestBuildStateMapper(unittest.TestCase):
    def test_build_state_mappings(self):
        combinations = [
            ("Needs building", "Unscheduled", "building_soon"),
            ("Needs building", "Pending", "building_soon"),
            ("Needs building", "Failed to upload", "building_soon"),
            (
                "Needs building",
                "Failed to release to channels",
                "building_soon",
            ),
            ("Needs building", "Uploaded", "building_soon"),
            ("Successfully built", "Unscheduled", "wont_release"),
            ("Successfully built", "Pending", "releasing_soon"),
            ("Successfully built", "Failed to upload", "release_failed"),
            (
                "Successfully built",
                "Failed to release to channels",
                "release_failed",
            ),
            ("Successfully built", "Uploaded", "released"),
            ("Currently building", "Unscheduled", "in_progress"),
            ("Currently building", "Pending", "in_progress"),
            ("Currently building", "Failed to upload", "in_progress"),
            (
                "Currently building",
                "Failed to release to channels",
                "in_progress",
            ),
            ("Currently building", "Uploaded", "in_progress"),
            ("Gathering build output", "Unscheduled", "in_progress"),
            ("Gathering build output", "Pending", "in_progress"),
            ("Gathering build output", "Failed to upload", "in_progress"),
            (
                "Gathering build output",
                "Failed to release to channels",
                "in_progress",
            ),
            ("Gathering build output", "Uploaded", "in_progress"),
            ("Failed to build", "Unscheduled", "failed_to_build"),
            ("Failed to build", "Pending", "failed_to_build"),
            ("Failed to build", "Failed to upload", "failed_to_build"),
            (
                "Failed to build",
                "Failed to release to channels",
                "failed_to_build",
            ),
            ("Failed to build", "Uploaded", "failed_to_build"),
            ("Dependency wait", "Unscheduled", "failed_to_build"),
            ("Dependency wait", "Pending", "failed_to_build"),
            ("Dependency wait", "Failed to upload", "failed_to_build"),
            (
                "Dependency wait",
                "Failed to release to channels",
                "failed_to_build",
            ),
            ("Dependency wait", "Uploaded", "failed_to_build"),
            ("Chroot problem", "Unscheduled", "failed_to_build"),
            ("Chroot problem", "Pending", "failed_to_build"),
            ("Chroot problem", "Failed to upload", "failed_to_build"),
            (
                "Chroot problem",
                "Failed to release to channels",
                "failed_to_build",
            ),
            ("Chroot problem", "Uploaded", "failed_to_build"),
            ("Build for superseded Source", "Unscheduled", "failed_to_build"),
            ("Build for superseded Source", "Pending", "failed_to_build"),
            (
                "Build for superseded Source",
                "Failed to upload",
                "failed_to_build",
            ),
            (
                "Build for superseded Source",
                "Failed to release to channels",
                "failed_to_build",
            ),
            ("Build for superseded Source", "Uploaded", "failed_to_build"),
            ("Failed to upload", "Unscheduled", "failed_to_build"),
            ("Failed to upload", "Pending", "failed_to_build"),
            ("Failed to upload", "Failed to upload", "failed_to_build"),
            (
                "Failed to upload",
                "Failed to release to channels",
                "failed_to_build",
            ),
            ("Failed to upload", "Uploaded", "failed_to_build"),
            ("Cancelling build", "Unscheduled", "cancelled"),
            ("Cancelling build", "Pending", "cancelled"),
            ("Cancelling build", "Cancelling build", "cancelled"),
            (
                "Cancelling build",
                "Failed to release to channels",
                "cancelled",
            ),
            ("Cancelling build", "Uploaded", "cancelled"),
            ("Cancelled build", "Unscheduled", "cancelled"),
            ("Cancelled build", "Pending", "cancelled"),
            ("Cancelled build", "Cancelled build", "cancelled"),
            (
                "Cancelled build",
                "Failed to release to channels",
                "cancelled",
            ),
            ("Cancelled build", "Uploaded", "cancelled"),
            ("Failed to upload", "Unscheduled", "failed_to_build"),
            ("Failed to upload", "Pending", "failed_to_build"),
            ("Failed to upload", "Failed to upload", "failed_to_build"),
            (
                "Failed to upload",
                "Failed to release to channels",
                "failed_to_build",
            ),
            ("Failed to upload", "Uploaded", "failed_to_build"),
        ]

        for build_state, upload_state, expected in combinations:
            result = map_build_and_upload_states(build_state, upload_state)
            self.assertEqual(result, expected)


class TestGetBuilds(unittest.TestCase):
    @patch("webapp.publisher.snaps.build_views.launchpad")
    def test_get_builds_includes_github_repository(self, mock_launchpad):
        """Test that get_builds includes GitHub repository information"""
        # Mock Launchpad snap data with GitHub repository URL
        lp_snap = {
            "store_name": "test-snap",
            "git_repository_url": "https://github.com/owner/repo",
        }

        # Mock build data from Launchpad
        mock_builds = [
            {
                "self_link": (
                    "https://api.launchpad.net/devel/~owner/"
                    "+snap/test-snap/+build/123"
                ),
                "arch_tag": "amd64",
                "datebuilt": "2023-01-01T12:00:00Z",
                "duration": "00:05:30",
                "build_log_url": (
                    "https://launchpad.net/~owner/+snap/test-snap/"
                    "+build/123/+files/buildlog.txt"
                ),
                "revision_id": "abcdef1234567890abcdef1234567890abcdef12",
                "buildstate": "Successfully built",
                "store_upload_status": "Uploaded",
                "title": "Test build",
            }
        ]

        mock_launchpad.get_snap_builds.return_value = mock_builds

        # Call get_builds
        result = get_builds(lp_snap, slice(0, 10))

        # Verify the result includes GitHub repository information
        self.assertEqual(result["total_builds"], 1)
        self.assertEqual(len(result["snap_builds"]), 1)

        build = result["snap_builds"][0]
        self.assertEqual(build["id"], "123")
        self.assertEqual(build["arch_tag"], "amd64")
        self.assertEqual(
            build["revision_id"], "abcdef1234567890abcdef1234567890abcdef12"
        )
        self.assertEqual(build["github_repository"], "owner/repo")
        self.assertEqual(build["status"], "released")

    @patch("webapp.publisher.snaps.build_views.launchpad")
    def test_get_builds_without_github_repository(self, mock_launchpad):
        """Test that get_builds handles snaps without GitHub repository"""
        # Mock Launchpad snap data without GitHub repository URL
        lp_snap = {"store_name": "test-snap"}

        # Mock build data from Launchpad
        mock_builds = [
            {
                "self_link": (
                    "https://api.launchpad.net/devel/~owner/"
                    "+snap/test-snap/+build/123"
                ),
                "arch_tag": "amd64",
                "datebuilt": "2023-01-01T12:00:00Z",
                "duration": "00:05:30",
                "build_log_url": (
                    "https://launchpad.net/~owner/+snap/test-snap/"
                    "+build/123/+files/buildlog.txt"
                ),
                "revision_id": "abcdef1234567890abcdef1234567890abcdef12",
                "buildstate": "Successfully built",
                "store_upload_status": "Uploaded",
                "title": "Test build",
            }
        ]

        mock_launchpad.get_snap_builds.return_value = mock_builds

        # Call get_builds
        result = get_builds(lp_snap, slice(0, 10))

        # Verify the result has None for GitHub repository
        build = result["snap_builds"][0]
        self.assertIsNone(build["github_repository"])


class TestExtractGithubRepository(unittest.TestCase):
    """Test the extract_github_repository helper function."""

    def test_extract_valid_github_url(self):
        """Test extracting owner/repo from valid GitHub URLs."""
        test_cases = [
            ("https://github.com/owner/repo", "owner/repo"),
            ("https://github.com/owner/repo.git", "owner/repo"),
            ("https://github.com/owner/repo/", "owner/repo"),
            ("https://github.com/owner/repo.git/", "owner/repo"),
            ("http://github.com/owner/repo", "owner/repo"),
        ]

        for url, expected in test_cases:
            with self.subTest(url=url):
                result = extract_github_repository(url)
                self.assertEqual(result, expected)

    def test_extract_invalid_urls(self):
        """Test that invalid URLs return None."""
        test_cases = [
            None,
            "",
            "https://gitlab.com/owner/repo",
            "https://bitbucket.org/owner/repo",
            "not-a-url",
            "https://github.com/",
            "https://github.com/owner",
        ]

        for url in test_cases:
            with self.subTest(url=url):
                result = extract_github_repository(url)
                self.assertIsNone(result)


class TestPostSnapBuilds(unittest.TestCase):
    """
    Test that post_snap_builds correctly passes the discharge macaroon
    through to Launchpad, and re-runs the store authorization handshake
    when a repository is already linked, so builds don't silently get
    stuck as "Won't release".
    """

    def setUp(self):
        self.app = create_app(testing=True)
        self.app.secret_key = "secret_key"
        self.app.config["WTF_CSRF_METHODS"] = []
        self.client = self.app.test_client()

        self.snap_name = "test-snap"
        self.endpoint_url = f"/api/{self.snap_name}/builds"

        # Stub the blueprint-level "has releases" gate so tests don't hit
        # the real dashboard API.
        release_history_patcher = patch(
            "webapp.decorators._dashboard.snap_release_history",
            return_value={"revisions": [{"revision": 1}]},
        )
        release_history_patcher.start()
        self.addCleanup(release_history_patcher.stop)

        with self.client.session_transaction() as session:
            session["publisher"] = {
                "image": None,
                "nickname": "Toto",
                "fullname": "El Toto",
                "email": "testing@testing.com",
                "stores": [],
            }
            session["macaroon_exchanged"] = "test-exchanged-macaroon"
            session["macaroon_discharge"] = "test-discharge-macaroon"
            session["github_auth_secret"] = "test-github-token"

    def _mock_dashboard(self, mock_dashboard):
        mock_dashboard.get_snap_info.return_value = {
            "snap_name": self.snap_name
        }
        mock_dashboard.get_account_snaps.return_value = {self.snap_name: {}}
        mock_dashboard.get_package_upload_macaroon.return_value = {
            "macaroon": "test-upload-macaroon"
        }

    def _mock_github(self, mock_github_class):
        mock_github = MagicMock()
        mock_github.check_permissions_over_repo.return_value = True
        mock_github.get_hook_by_url.return_value = None
        mock_github_class.return_value = mock_github
        return mock_github

    @patch("webapp.publisher.snaps.build_views.validate_repo")
    @patch("webapp.publisher.snaps.build_views.GitHub")
    @patch("webapp.publisher.snaps.build_views.launchpad")
    @patch("webapp.publisher.snaps.build_views.dashboard")
    def test_new_link_passes_discharge_macaroon_to_create_snap(
        self,
        mock_dashboard,
        mock_launchpad,
        mock_github_class,
        mock_validate_repo,
    ):
        self._mock_dashboard(mock_dashboard)
        self._mock_github(mock_github_class)
        mock_validate_repo.return_value = {"success": True}

        # No existing snap linked in Launchpad yet.
        mock_launchpad.get_snap_by_store_name.return_value = None
        mock_launchpad.get_snap.return_value = False

        response = self.client.post(
            self.endpoint_url,
            data={"github_repository": "owner/repo"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {
                "success": False,
                "authorization_required": True,
                "redirect_url": "/login/snap-build-authorization",
            },
        )
        with self.client.session_transaction() as session:
            self.assertEqual(
                session["pending_snap_authorization"],
                {
                    "action": "link",
                    "snap_name": self.snap_name,
                    "git_url": "https://github.com/owner/repo",
                    "owner": "owner",
                    "repo": "repo",
                    "lp_snap_name": None,
                    "root_macaroon": "test-upload-macaroon",
                    "redirect_url": f"/{self.snap_name}/builds",
                },
            )

        mock_launchpad.create_snap.assert_not_called()
        mock_launchpad.complete_snap_authorization.assert_not_called()

    @patch("webapp.publisher.snaps.build_views.validate_repo")
    @patch("webapp.publisher.snaps.build_views.GitHub")
    @patch("webapp.publisher.snaps.build_views.launchpad")
    @patch("webapp.publisher.snaps.build_views.dashboard")
    def test_new_link_without_discharge_in_session(
        self,
        mock_dashboard,
        mock_launchpad,
        mock_github_class,
        mock_validate_repo,
    ):
        """Backward compat: no discharge in session -> None is passed."""
        self._mock_dashboard(mock_dashboard)
        self._mock_github(mock_github_class)
        mock_validate_repo.return_value = {"success": True}

        mock_launchpad.get_snap_by_store_name.return_value = None
        mock_launchpad.get_snap.return_value = False

        with self.client.session_transaction() as session:
            del session["macaroon_discharge"]

        response = self.client.post(
            self.endpoint_url,
            data={"github_repository": "owner/repo"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {
                "success": False,
                "authorization_required": True,
                "redirect_url": "/login/snap-build-authorization",
            },
        )
        with self.client.session_transaction() as session:
            self.assertEqual(
                session["pending_snap_authorization"]["action"], "link"
            )
            self.assertEqual(
                session["pending_snap_authorization"]["snap_name"],
                self.snap_name,
            )
            self.assertEqual(
                session["pending_snap_authorization"]["git_url"],
                "https://github.com/owner/repo",
            )
            self.assertEqual(
                session["pending_snap_authorization"]["root_macaroon"],
                "test-upload-macaroon",
            )

        mock_launchpad.create_snap.assert_not_called()

    @patch("webapp.publisher.snaps.build_views.validate_repo")
    @patch("webapp.publisher.snaps.build_views.GitHub")
    @patch("webapp.publisher.snaps.build_views.launchpad")
    @patch("webapp.publisher.snaps.build_views.dashboard")
    def test_existing_link_reauthorizes_instead_of_noop(
        self,
        mock_dashboard,
        mock_launchpad,
        mock_github_class,
        mock_validate_repo,
    ):
        """
        Reconnecting an already-linked repository must re-run the store
        authorization handshake (previously a silent no-op), so users can
        self-repair snaps stuck as "Won't release".
        """
        self._mock_dashboard(mock_dashboard)
        self._mock_github(mock_github_class)
        mock_validate_repo.return_value = {"success": True}

        mock_launchpad.get_snap_by_store_name.return_value = {
            "name": "lp-snap-name",
            "git_repository_url": "https://github.com/owner/repo",
        }

        response = self.client.post(
            self.endpoint_url,
            data={"github_repository": "owner/repo"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {
                "success": False,
                "authorization_required": True,
                "redirect_url": "/login/snap-build-authorization",
            },
        )
        with self.client.session_transaction() as session:
            self.assertEqual(
                session["pending_snap_authorization"],
                {
                    "action": "repair",
                    "snap_name": self.snap_name,
                    "git_url": "https://github.com/owner/repo",
                    "owner": "owner",
                    "repo": "repo",
                    "lp_snap_name": "lp-snap-name",
                    "root_macaroon": "test-upload-macaroon",
                    "redirect_url": f"/{self.snap_name}/builds",
                },
            )

        mock_launchpad.complete_snap_authorization.assert_not_called()
        mock_launchpad.create_snap.assert_not_called()

    @patch("webapp.publisher.snaps.build_views.validate_repo")
    @patch("webapp.publisher.snaps.build_views.GitHub")
    @patch("webapp.publisher.snaps.build_views.launchpad")
    @patch("webapp.publisher.snaps.build_views.dashboard")
    def test_mismatched_repo_raises(
        self,
        mock_dashboard,
        mock_launchpad,
        mock_github_class,
        mock_validate_repo,
    ):
        """A snap already linked to a different repo should still error."""
        self._mock_dashboard(mock_dashboard)
        self._mock_github(mock_github_class)
        mock_validate_repo.return_value = {"success": True}

        mock_launchpad.get_snap_by_store_name.return_value = {
            "name": "lp-snap-name",
            "git_repository_url": "https://github.com/owner/other-repo",
        }

        with self.assertRaises(AttributeError):
            self.client.post(
                self.endpoint_url,
                data={"github_repository": "owner/repo"},
            )

        mock_launchpad.complete_snap_authorization.assert_not_called()
        mock_launchpad.create_snap.assert_not_called()
