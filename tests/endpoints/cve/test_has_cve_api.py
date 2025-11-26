from unittest.mock import patch
from tests.endpoints.endpoint_testing import TestEndpoints
from cache.cache_utility import redis_cache


class TestCveEndpoints(TestEndpoints):
    def _log_in_with_canonical_status(self, is_canonical=False):
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
        self._log_in_with_canonical_status(is_canonical=value)

    def setUp(self):
        super().setUp()
        # Clear cache before each test
        if redis_cache.redis_available:
            try:
                redis_cache.client.flushdb()
            except Exception:
                pass
        else:
            redis_cache.fallback.clear()
        self._log_in_with_canonical_status(is_canonical=False)


class TestModelServiceEndpoints(TestCveEndpoints):
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
        self.assertEqual(data["data"]["revisions"], [123, 321])

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
