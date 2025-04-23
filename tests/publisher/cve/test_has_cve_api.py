from unittest import TestCase
from webapp.app import create_app
from unittest.mock import patch


class TestEndpoints(TestCase):
    def setUp(self):
        self.app = create_app(testing=True)
        self.client = self.app.test_client()
        self._log_in(is_canonical=False)

    def _log_in(self, is_canonical=False):
        test_macaroon = "test_macaroon"
        with self.client.session_transaction() as s:
            s["publisher"] = {
                "account_id": "test_account_id",
                "image": None,
                "nickname": "XYZ",
                "fullname": "ABC XYZ",
                "email": "testing@testing.com",
                "stores": [],
                "is_canonical": is_canonical,
            }
            s["macaroons"] = test_macaroon
            s["developer_token"] = test_macaroon
            s["exchanged_developer_token"] = True

    def _set_user_is_canonical(self, value):
        self._log_in(is_canonical=value)


class TestModelServiceEndpoints(TestEndpoints):
    @patch(
        "webapp.publisher.cve.cve_helper.CveHelper.get_revisions_with_cves",
        return_value=[123, 321],
    )
    @patch(
        "canonicalwebteam.store_api.dashboard.Dashboard.get_snap_info",
        return_value={"snap_id": "id"},
    )
    def test_has_cves_for_canonical_user(self, mock_get_snap_info, mock_get):
        self._set_user_is_canonical(True)

        response = self.client.get("api/test/cves")
        data = response.json

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["success"], True)

    @patch(
        "webapp.publisher.cve.cve_helper.CveHelper.get_revisions_with_cves",
        return_value=[],
    )
    @patch(
        "canonicalwebteam.store_api.dashboard.Dashboard.get_snap_info",
        return_value={"snap_id": "id"},
    )
    def test_has_cves_no_data(self, mock_get_snap_info, mock_get):
        self._set_user_is_canonical(True)

        response = self.client.get("api/test/cves")
        data = response.json

        self.assertEqual(response.status_code, 404)
        self.assertEqual(data["success"], False)

    def test_has_cves_for_non_canonical_user(self):
        response = self.client.get("api/test/cves")
        data = response.json

        self.assertEqual(response.status_code, 403)
        self.assertEqual(data["success"], False)
