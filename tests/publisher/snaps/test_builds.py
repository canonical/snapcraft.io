import unittest


from webapp.publisher.snaps.builds import map_build_and_upload_states


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
            ("Cancelling build", "Unscheduled", "failed_to_build"),
            ("Cancelling build", "Pending", "failed_to_build"),
            ("Cancelling build", "Cancelling build", "failed_to_build"),
            (
                "Cancelling build",
                "Failed to release to channels",
                "failed_to_build",
            ),
            ("Cancelling build", "Uploaded", "failed_to_build"),
            ("Cancelled build", "Unscheduled", "failed_to_build"),
            ("Cancelled build", "Pending", "failed_to_build"),
            ("Cancelled build", "Cancelled build", "failed_to_build"),
            (
                "Cancelled build",
                "Failed to release to channels",
                "failed_to_build",
            ),
            ("Cancelled build", "Uploaded", "failed_to_build"),
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
