import responses

from tests.endpoint_testing import BaseTestCases


class GetAgreementPageNotAuth(BaseTestCases.EndpointGetLoggedOut):
    def setUp(self):
        endpoint_url = '/account/agreement'
        super().setUp(None, endpoint_url)


class GetAgreementPage(BaseTestCases.BaseAppTesting):
    def setUp(self):
        endpoint_url = '/account/agreement'
        super().setUp(None, None, endpoint_url)

    @responses.activate
    def test_agreement_logged_in(self):
        self._log_in(self.client)
        response = self.client.get("/account/agreement")

        assert response.status_code == 200
        self.assert_template_used('developer_programme_agreement.html')


class PostAgreementPageNotAuth(BaseTestCases.EndpointPostLoggedOut):
    def setUp(self):
        endpoint_url = '/account/agreement'
        super().setUp(None, endpoint_url)


class PostAgreementPage(BaseTestCases.EndpointPostLoggedIn):
    def setUp(self):
        api_url = 'https://dashboard.snapcraft.io/dev/api/agreement/'
        data = {
            'i_agree': 'on'
        }
        endpoint_url = '/account/agreement'

        super().setUp(None, api_url, endpoint_url, data)

    @responses.activate
    def test_post_agreement_on(self):
        responses.add(
            responses.POST,
            self.api_url,
            json={}, status=200)

        response = self.client.post(
            self.endpoint_url,
            data={
                'i_agree': 'on'
            },
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
            b'{"latest_tos_accepted": true}',
            called.request.body
            )

        self.assertEqual(302, response.status_code)
        self.assertEqual(
            'http://localhost/account',
            response.location)

    @responses.activate
    def test_post_agreement_off(self):
        response = self.client.post(
            self.endpoint_url,
            data={
                'i_agree': 'off'
            },
        )

        self.assertEqual(302, response.status_code)
        self.assertEqual(
            'http://localhost/account/agreement',
            response.location)
