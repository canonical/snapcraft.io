import responses
from tests.publisher.endpoint_testing import BaseTestCases


class GetUsernamePageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = '/account/username'
        super().setUp(
            snap_name=None,
            endpoint_url=endpoint_url)


class GetUsernamePage(BaseTestCases.BaseAppTesting):
    def setUp(self):
        endpoint_url = '/account/username'
        super().setUp(
            snap_name=None,
            api_url=None,
            endpoint_url=endpoint_url)

    @responses.activate
    def test_agreement_logged_in(self):
        self._log_in(self.client)
        response = self.client.get("/account/username")

        assert response.status_code == 200
        self.assert_template_used('publisher/username.html')


class PostUsernamePageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = '/account/username'
        super().setUp(
            snap_name=None,
            endpoint_url=endpoint_url,
            method_endpoint='POST')


class PostUsernamePage(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        api_url = 'https://dashboard.snapcraft.io/dev/api/account'
        data = {
            'username': 'toto'
        }
        endpoint_url = '/account/username'

        super().setUp(
            snap_name=None,
            api_url=api_url,
            endpoint_url=endpoint_url,
            method_endpoint='POST',
            method_api='PATCH',
            data=data)

    @responses.activate
    def test_post_username(self):
        responses.add(
            responses.PATCH,
            self.api_url,
            json={}, status=204)

        response = self.client.post(
            self.endpoint_url,
            data=self.data,
        )

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.api_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))
        self.assertEqual(
            called.response.json(),
            {},
        )
        self.assertEqual(
            b'{"short_namespace": "toto"}',
            called.request.body)

        self.assertEqual(302, response.status_code)
        self.assertEqual(
            'http://localhost/account/',
            response.location)

    @responses.activate
    def test_post_username_empty(self):
        response = self.client.post(
            self.endpoint_url,
            data={'username': ''},
        )

        self.assertEqual(302, response.status_code)
        self.assertEqual(
            'http://localhost/account/username',
            response.location)

    @responses.activate
    def test_post_no_data(self):
        response = self.client.post(
            self.endpoint_url,
            data={}
        )

        self.assertEqual(302, response.status_code)
        self.assertEqual(
            'http://localhost/account/username',
            response.location)
