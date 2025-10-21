import responses
from tests.publisher.endpoint_testing import BaseTestCases
from webapp.authentication import SESSION_DATA_KEYS

# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class LogoutRedirects(BaseTestCases.BaseAppTesting):
    def setUp(self):
        endpoint_url = "/logout"

        super().setUp(snap_name=None, endpoint_url=endpoint_url, api_url=None)

    @responses.activate
    def test_logout(self):
        with self.client.session_transaction() as session:
            for key in SESSION_DATA_KEYS:
                session[key] = "MOCK VALUE"

        response = self.client.get(self.endpoint_url)

        self.assertEqual(302, response.status_code)

        self.assertEqual("/", response.location)

        self.assertIn("session=;", response.headers.get("Set-Cookie"))
