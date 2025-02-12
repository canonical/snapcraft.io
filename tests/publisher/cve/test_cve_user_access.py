import unittest
from unittest.mock import patch

from webapp.publisher.cve.cve_helper import CveHelper


class CveUserAccessTest(unittest.TestCase):
    @patch("webapp.publisher.cve.cve_helper.logic.get_stores")
    def test_can_snap_publisher_access_cve_data(self, mock_get_stores):
        snap_publisher_info = {"id": "some-user", "username": "user"}

        snap_details = {
            "store": "some-store",
            "publisher": snap_publisher_info,
        }
        account_info = {
            "username": "user",
            "stores": ["some-store"],
            "snaps": {"16": {"test-snap": {}}},
        }

        result = CveHelper.can_user_access_cve_data(
            "test-snap",
            snap_details=snap_details,
            account_info=account_info,
            is_user_canonical=False,
        )

        self.assertTrue(result)

    @patch("webapp.publisher.cve.cve_helper.logic.get_stores")
    def test_can_admin_access_cve_data(self, mock_get_stores):
        mock_get_stores.return_value = [{"name": "some-store"}]
        account_info = {
            "username": "user",
            "stores": ["some-store"],
            "snaps": {"16": {}},
        }
        snap_details = {
            "store": "some-store",
            "publisher": {"id": "some-publisher", "username": "publisher"},
        }

        result = CveHelper.can_user_access_cve_data(
            "test-snap",
            account_info=account_info,
            is_user_canonical=False,
            snap_details=snap_details,
        )

        self.assertTrue(result)

    @patch("webapp.publisher.cve.cve_helper.logic.get_stores")
    def test_can_canonical_publisher_access_cve_data_of_global_canonical_snap(
        self, mock_get_stores
    ):
        mock_get_stores.return_value = []
        account_info = {
            "username": "user",
            "stores": ["Global"],
            "snaps": {"16": {"test-snap": {}}},
        }

        snap_publisher_info = {"id": "canonical", "username": "canonical"}
        snap_details = {
            "store": "Global",
            "publisher": snap_publisher_info,
        }

        result = CveHelper.can_user_access_cve_data(
            "test-snap",
            account_info=account_info,
            is_user_canonical=True,
            snap_details=snap_details,
        )

        self.assertTrue(result)

    @patch("webapp.publisher.cve.cve_helper.logic.get_stores")
    def test_can_collaborator_access_cve_data_of_global_snap(
        self, mock_get_stores
    ):
        snap_publisher_info = {"id": "some-publisher", "username": "publisher"}
        snap_details = {
            "store": "Global",
            "publisher": snap_publisher_info,
        }

        account_details = {
            "username": "user",
            "stores": ["Global"],
            "snaps": {"16": {"test-snap": {}}},
        }

        mock_get_stores.return_value = []
        result = CveHelper.can_user_access_cve_data(
            "test-snap",
            account_info=account_details,
            is_user_canonical=False,
            snap_details=snap_details,
        )

        self.assertTrue(result)

    @patch("webapp.publisher.cve.cve_helper.logic.get_stores")
    def test_non_collab_publisher_user_fail_access_cve_data_of_global_snap(
        self, mock_get_stores
    ):
        mock_get_stores.return_value = []
        account_info = {
            "username": "user",
            "stores": ["Global"],
            "snaps": {"16": {}},
        }
        snap_publisher_info = {"id": "some-publisher", "username": "publisher"}

        snap_info = {
            "store": "Global",
            "publisher": snap_publisher_info,
        }

        result = CveHelper.can_user_access_cve_data(
            "test-snap",
            account_info=account_info,
            is_user_canonical=False,
            snap_details=snap_info,
        )

        self.assertFalse(result)

    @patch("webapp.publisher.cve.cve_helper.logic.get_stores")
    def test_non_collab_publisher_user_fail_access_cve_data_of_brand_snap(
        self, mock_get_stores
    ):

        mock_get_stores.return_value = []

        account_info = {
            "username": "user",
            "stores": ["some-store"],
            "snaps": {"16": {}},
        }

        snap_publisher_info = {"id": "some-publisher", "username": "publisher"}
        snap_info = {
            "store": "some-store",
            "publisher": snap_publisher_info,
        }

        result = CveHelper.can_user_access_cve_data(
            "test-snap",
            account_info=account_info,
            is_user_canonical=False,
            snap_details=snap_info,
        )

        self.assertFalse(result)
