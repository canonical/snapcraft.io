import unittest
from unittest.mock import patch
import flask

from webapp.publisher.cve.cve_helper import CveHelper


class CveHelperUserAccessTest(unittest.TestCase):
    def setUp(self):
        self.helper = CveHelper()

    # User access tests
    def configure_user(
        self,
        mock_get_stores,
        mock_get_account,
        mock_get_snap_info,
        is_canonical_user,
        is_global_store,
        is_user_snap_publisher,
        is_collaborator,
        is_admin,
        is_snap_published_by_canonical,
    ):
        # flask.session = {"publisher": {"is_canonical": is_canonical_user}}

        snap_publisher_info = {"id": "some-publisher", "username": "publisher"}
        if is_user_snap_publisher:
            snap_publisher_info = {"id": "some-user", "username": "user"}
        elif is_snap_published_by_canonical:
            snap_publisher_info = {"id": "canonical", "username": "canonical"}

        mock_get_snap_info.return_value = {
            "store": "Global" if is_global_store else "some-store",
            "publisher": snap_publisher_info,
        }

        mock_get_account.return_value = {
            "username": "user",
            "stores": ["Global" if is_global_store else "some-store"],
            "snaps": {"16": {"test-snap": {}} if is_collaborator else {}},
        }

        mock_get_stores.return_value = (
            [{"name": "some-store"}] if is_admin else []
        )

    @patch("webapp.publisher.cve.cve_helper.publisher_api.get_snap_info")
    @patch("webapp.publisher.cve.cve_helper.publisher_api.get_account")
    @patch("webapp.publisher.cve.cve_helper.logic.get_stores")
    def test_can_snap_publisher_access_cve_data(
        self, mock_get_stores, mock_get_account, mock_get_snap_info
    ):
        self.configure_user(
            is_admin=False,
            is_canonical_user=False,
            is_collaborator=True,
            is_global_store=False,
            is_user_snap_publisher=True,
            is_snap_published_by_canonical=False,
            mock_get_account=mock_get_account,
            mock_get_snap_info=mock_get_snap_info,
            mock_get_stores=mock_get_stores,
        )

        result = self.helper.can_user_access_cve_data("test-snap")

        self.assertTrue(result)

#     @patch("webapp.publisher.cve.cve_helper.publisher_api.get_snap_info")
#     @patch("webapp.publisher.cve.cve_helper.publisher_api.get_account")
#     @patch("webapp.publisher.cve.cve_helper.logic.get_stores")
#     def test_can_admin_access_cve_data(
#         self, mock_get_stores, mock_get_account, mock_get_snap_info
#     ):
#         self.configure_user(
#             is_admin=True,
#             is_canonical_user=False,
#             is_collaborator=False,
#             is_global_store=False,
#             is_user_snap_publisher=False,
#             is_snap_published_by_canonical=False,
#             mock_get_account=mock_get_account,
#             mock_get_snap_info=mock_get_snap_info,
#             mock_get_stores=mock_get_stores,
#         )

#         result = self.helper.can_user_access_cve_data("test-snap")

#         self.assertTrue(result)

#     @patch("webapp.publisher.cve.cve_helper.publisher_api.get_snap_info")
#     @patch("webapp.publisher.cve.cve_helper.publisher_api.get_account")
#     @patch("webapp.publisher.cve.cve_helper.logic.get_stores")
#     def test_can_canonical_publisher_access_cve_data_of_global_canonical_snap(
#         self, mock_get_stores, mock_get_account, mock_get_snap_info
#     ):
#         self.configure_user(
#             is_admin=False,
#             is_canonical_user=True,
#             is_collaborator=False,
#             is_global_store=True,
#             is_user_snap_publisher=False,
#             is_snap_published_by_canonical=True,
#             mock_get_account=mock_get_account,
#             mock_get_snap_info=mock_get_snap_info,
#             mock_get_stores=mock_get_stores,
#         )

#         result = self.helper.can_user_access_cve_data("test-snap")

#         self.assertTrue(result)

#     @patch("webapp.publisher.cve.cve_helper.publisher_api.get_snap_info")
#     @patch("webapp.publisher.cve.cve_helper.publisher_api.get_account")
#     @patch("webapp.publisher.cve.cve_helper.logic.get_stores")
#     def test_can_collaborator_access_cve_data_of_global_snap(
#         self, mock_get_stores, mock_get_account, mock_get_snap_info
#     ):
#         self.configure_user(
#             is_admin=False,
#             is_canonical_user=False,
#             is_collaborator=True,
#             is_global_store=True,
#             is_user_snap_publisher=False,
#             is_snap_published_by_canonical=False,
#             mock_get_account=mock_get_account,
#             mock_get_snap_info=mock_get_snap_info,
#             mock_get_stores=mock_get_stores,
#         )

#         result = self.helper.can_user_access_cve_data("test-snap")

#         self.assertTrue(result)

#     @patch("webapp.publisher.cve.cve_helper.publisher_api.get_snap_info")
#     @patch("webapp.publisher.cve.cve_helper.publisher_api.get_account")
#     @patch("webapp.publisher.cve.cve_helper.logic.get_stores")
#     def test_non_collab_publisher_user_fail_access_cve_data_of_global_snap(
#         self, mock_get_stores, mock_get_account, mock_get_snap_info
#     ):
#         self.configure_user(
#             is_admin=False,
#             is_canonical_user=False,
#             is_collaborator=False,
#             is_global_store=True,
#             is_user_snap_publisher=False,
#             is_snap_published_by_canonical=False,
#             mock_get_account=mock_get_account,
#             mock_get_snap_info=mock_get_snap_info,
#             mock_get_stores=mock_get_stores,
#         )
#         result = self.helper.can_user_access_cve_data("test-snap")

#         self.assertFalse(result)

#     @patch("webapp.publisher.cve.cve_helper.publisher_api.get_snap_info")
#     @patch("webapp.publisher.cve.cve_helper.publisher_api.get_account")
#     @patch("webapp.publisher.cve.cve_helper.logic.get_stores")
#     def test_non_collab_publisher_user_fail_access_cve_data_of_brand_snap(
#         self, mock_get_stores, mock_get_account, mock_get_snap_info
#     ):
#         self.configure_user(
#             is_admin=False,
#             is_canonical_user=False,
#             is_collaborator=False,
#             is_global_store=False,
#             is_user_snap_publisher=False,
#             is_snap_published_by_canonical=False,
#             mock_get_account=mock_get_account,
#             mock_get_snap_info=mock_get_snap_info,
#             mock_get_stores=mock_get_stores,
#         )

#         result = self.helper.can_user_access_cve_data("test-snap")

#         self.assertFalse(result)
