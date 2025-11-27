from unittest import TestCase
from unittest.mock import patch

from webapp.app import create_app
from webapp.authentication import get_publishergw_authorization_header
from cache.cache_utility import redis_cache


class TestEndpoints(TestCase):
    def _log_in(self, client):
        test_macaroon = "test_macaroon"
        with client.session_transaction() as s:
            s["publisher"] = {
                "account_id": "test_account_id",
                "image": None,
                "nickname": "XYZ",
                "fullname": "ABC XYZ",
                "email": "testing@testing.com",
                "stores": [],
            }
            s["macaroons"] = "test_macaroon"
            s["developer_token"] = test_macaroon
            s["exchanged_developer_token"] = True

        return get_publishergw_authorization_header(test_macaroon)

    def setUp(self):
        # Clear cache before each test
        if redis_cache.redis_available:
            try:
                redis_cache.client.flushdb()
            except Exception:
                pass
        else:
            redis_cache.fallback.clear()

        self.app = create_app(testing=True)
        self.client = self.app.test_client()
        self._log_in(self.client)


class TestModelServiceEndpoints(TestEndpoints):
    def setUp(self):
        self.api_key = "qwertyuioplkjhgfdsazxcvbnmkiopuytrewqasdfghjklmnbv"
        self.mock_get_store = patch(
            "webapp.endpoints.views.dashboard.get_store"
        ).start()
        super().setUp()
