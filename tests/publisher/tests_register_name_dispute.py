import responses
from tests.publisher.endpoint_testing import BaseTestCases


class GetRegisterNameDisputePageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = "/register-name-dispute"
        super().setUp(snap_name=None, endpoint_url=endpoint_url)


class GetRegisterNameDisputePage(BaseTestCases.BaseAppTesting):
    def setUp(self):
        self.store = "testing-store-id1"
        super().setUp(
            snap_name="test-snap",
            api_url=None,
            endpoint_url="/register-name-dispute",
        )
        self.user_url = "https://dashboard.snapcraft.io/dev/api/account"
        self.user_payload = {
            "error_list": [],
            "stores": [
                {
                    "id": "testing-store-id1",
                    "name": "test-store",
                    "roles": ["admin", "review", "view", "access"],
                },
            ],
        }

    @responses.activate
    def test_register_name_dispute_logged_in(self):
        self._log_in(self.client)
        responses.add(
            responses.GET, self.user_url, json=self.user_payload, status=200
        )
        endpoint_url = "{}?snap-name={}&store={}".format(
            self.endpoint_url, self.snap_name, self.store
        )
        response = self.client.get(endpoint_url)

        self.assertEqual(response.status_code, 200)
        self.assert_template_used("store/publisher.html")
        self.assert_context("snap_name", "test-snap")

    @responses.activate
    def test_register_name_dispute_redirect_no_snap_name(self):
        self._log_in(self.client)
        responses.add(
            responses.GET, self.user_url, json=self.user_payload, status=200
        )
        response = self.client.get(self.endpoint_url)

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.headers["Location"], "/register-snap")
