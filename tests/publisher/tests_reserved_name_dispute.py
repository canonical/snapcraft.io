import responses
from tests.publisher.endpoint_testing import BaseTestCases


class GetRequestReservedNameNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = "/request-reserved-name"
        super().setUp(snap_name=None, endpoint_url=endpoint_url)


class GetRequestReservedName(BaseTestCases.BaseAppTesting):
    def setUp(self):
        self.store = "testing-store-id1"
        super().setUp(
            snap_name="test-snap",
            api_url=None,
            endpoint_url="/request-reserved-name",
        )
        self.user_url = "https://dashboard.snapcraft.io/dev/api/account"
        self.user_payload = {
            "error_list": [],
            "stores": [
                {
                    "id": "testing-store-id1",
                    "name": "test-store",
                    "roles": ["admin", "review", "view", "access"],
                }
            ],
        }

    @responses.activate
    def test_request_reserved_name_logged_in(self):
        self._log_in(self.client)
        responses.add(
            responses.GET, self.user_url, json=self.user_payload, status=200
        )
        endpoint_url = "{}?snap-name={}&store={}".format(
            self.endpoint_url, self.snap_name, self.store
        )
        response = self.client.get(endpoint_url)

        self.assertEqual(response.status_code, 302)

    @responses.activate
    def test_request_reserved_name_redirect_no_snap_name(self):
        self._log_in(self.client)
        responses.add(
            responses.GET, self.user_url, json=self.user_payload, status=200
        )
        response = self.client.get(self.endpoint_url)

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.headers["Location"], "/register-snap")
