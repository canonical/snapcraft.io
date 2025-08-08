import unittest
from unittest.mock import patch

from webapp.publisher.snaps.builds import map_build_and_upload_states
from webapp.publisher.snaps.build_views import get_builds


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
