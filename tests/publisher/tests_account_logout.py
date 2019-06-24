import responses
from tests.publisher.endpoint_testing import BaseTestCases

# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class LogoutRedirects(BaseTestCases.BaseAppTesting):
    def setUp(self):
        endpoint_url = "/logout"

        super().setUp(snap_name=None, endpoint_url=endpoint_url, api_url=None)

    @responses.activate
    def test_logout(self):
        response = self.client.get(self.endpoint_url)

        self.assertEqual(302, response.status_code)

        self.assertEqual(
            (
                "https://login.ubuntu.com/+logout"
                "?return_to=http%3A%2F%2Flocalhost%2F&return_now=True"
            ),
            response.location,
        )

    def test_no_redirect_logout(self):
        bad_param_response = self.client.get(
            self.endpoint_url + "?no_redirect=false"
        )

        self.assertEqual(302, bad_param_response.status_code)
        self.assertEqual(
            (
                "https://login.ubuntu.com/+logout"
                "?return_to=http%3A%2F%2Flocalhost%2F&return_now=True"
            ),
            bad_param_response.location,
        )

        response = self.client.get(self.endpoint_url + "?no_redirect=true")

        self.assertEqual(302, response.status_code)
        self.assertEqual("http://localhost/", response.location)
