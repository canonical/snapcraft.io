import responses
from tests.publisher.endpoint_testing import BaseTestCases


class GetRequestReservedNameNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = "/request-reserved-name"
        super().setUp(snap_name=None, endpoint_url=endpoint_url)


class GetRequestReservedName(BaseTestCases.BaseAppTesting):
    def setUp(self):
        super().setUp(
            snap_name="test-snap",
            api_url=None,
            endpoint_url="/request-reserved-name",
        )

    @responses.activate
    def test_request_reserved_name_logged_in(self):
        self._log_in(self.client)

        endpoint_url = "{}?snap-name={}".format(
            self.endpoint_url, self.snap_name
        )
        response = self.client.get(endpoint_url)

        self.assertEqual(response.status_code, 302)

    @responses.activate
    def test_request_reserved_name_redirect_no_snap_name(self):
        self._log_in(self.client)
        response = self.client.get(self.endpoint_url)

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, "/register-snap")
