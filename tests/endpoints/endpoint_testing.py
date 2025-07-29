from unittest import TestCase

from webapp.app import create_app
from webapp.authentication import get_publishergw_authorization_header


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
        self.app = create_app(testing=True)
        self.client = self.app.test_client()
        self._log_in(self.client)
