from unittest.mock import patch
from unittest import TestCase
import flask

from webapp.endpoints.publisher import listing
from webapp.authentication import get_publishergw_authorization_header


class TestCacheLeakage(TestCase):
    def _log_in(
        self,
        client,
        nickname,
    ):
        test_macaroon = "test_macaroon"
        with client.session_transaction() as s:
            s["publisher"] = {
                "account_id": f"{nickname}-account_id",
                "image": None,
                "nickname": nickname,
                "fullname": f"{nickname} Fullname",
                "email": f"{nickname}@testing.com",
                "stores": [],
            }
            s["macaroons"] = "test_macaroon"
            s["developer_token"] = test_macaroon
            s["exchanged_developer_token"] = True

        return get_publishergw_authorization_header(test_macaroon)

    def setUp(self):
        from webapp.app import create_app

        self.app = create_app(testing=True)
        self.client = self.app.test_client()

    @patch.object(listing.helpers, "get_yaml")
    @patch.object(listing.helpers, "get_licenses")
    @patch.object(listing.logic, "filter_categories")
    @patch.object(listing.logic, "replace_reserved_categories_key")
    @patch.object(listing.logic, "categorise_media")
    @patch.object(listing, "get_categories")
    @patch.object(listing, "device_gateway")
    @patch.object(listing, "dashboard")
    def test_snap_info_cache_is_owner_scoped(
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
        """Ensure owner A's private snap_info isn't returned to owner B."""

        self._log_in(self.client, "ownerA")
        # Owner A's private snap details
        snap_name = "test_private_snap"

        test_private_snap = {
            "title": "Owner A Title",
            "snap_name": snap_name,
            "summary": "Private summary A",
            "description": "Private desc",
            "snap_id": "snap-id-a",
            "public_metrics_enabled": True,
            "public_metrics_blacklist": [],
            "media": [],
            "links": {},
            "license": "MIT",
            "categories": [],
            "video_urls": [],
            "update_metadata_on_release": False,
            "private": True,
            "publisher": {"username": "ownerA"},
        }

        mock_device_gateway.get_categories.return_value = []
        mock_get_categories.return_value = []
        mock_categorise_media.return_value = ([], [], [])
        mock_replace_reserved_categories_key.return_value = {"categories": []}
        mock_filter_categories.return_value = {"categories": []}
        mock_get_licenses.return_value = []
        mock_get_yaml.return_value = []

        mock_dashboard.get_snap_info.return_value = test_private_snap

        with self.client.session_transaction() as session_a:
            session_a["publisher"] = {
                "account_id": "ownerA-id",
                "image": None,
                "nickname": "ownerA",
                "fullname": "Owner A",
                "email": "ownera@example.com",
                "stores": [],
            }

            resp1 = self.client.get(f"/api/{snap_name}/listing")
            self.assertEqual(resp1.status_code, 200)
            data1 = resp1.json
            self.assertTrue(data1["success"])
            self.assertEqual(data1["data"]["title"], "Owner A Title")

    @patch.object(listing.helpers, "get_yaml")
    @patch.object(listing.helpers, "get_licenses")
    @patch.object(listing.logic, "filter_categories")
    @patch.object(listing.logic, "replace_reserved_categories_key")
    @patch.object(listing.logic, "categorise_media")
    @patch.object(listing, "get_categories")
    @patch.object(listing, "device_gateway")
    @patch.object(listing, "dashboard")
    def test_user_cannot_access_private_snap_of_another_user(
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
        self._log_in(self.client, "ownerB")

        mock_device_gateway.get_categories.return_value = []
        mock_get_categories.return_value = []
        mock_categorise_media.return_value = ([], [], [])
        mock_replace_reserved_categories_key.return_value = {"categories": []}
        mock_filter_categories.return_value = {"categories": []}
        mock_get_licenses.return_value = []
        mock_get_yaml.return_value = []

        def snap_info_side_effect(*args, **kwargs):
            flask.abort(404)

        mock_dashboard.get_snap_info.side_effect = snap_info_side_effect

        # 2) Log in as Owner B and fetch listing, should get 404
        with self.client.session_transaction() as session_b:
            session_b["publisher"] = {
                "account_id": "ownerB-id",
                "image": None,
                "nickname": "ownerB",
                "fullname": "Owner B",
                "email": "ownerb@example.com",
                "stores": [],
            }

            resp = self.client.get("/api/test_private_snap/listing")
            self.assertEqual(resp.status_code, 404)
