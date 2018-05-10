import responses
from tests.endpoint_testing import BaseTestCases


class GetRegisterNamePageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = '/account/register-name'
        super().setUp(
            snap_name=None,
            endpoint_url=endpoint_url)


class GetRegisterNamePage(BaseTestCases.BaseAppTesting):
    def setUp(self):
        endpoint_url = '/account/register-name'
        super().setUp(
            snap_name=None,
            api_url=None,
            endpoint_url=endpoint_url)

    @responses.activate
    def test_register_name_logged_in(self):
        self._log_in(self.client)
        response = self.client.get(self.endpoint_url)

        assert response.status_code == 200
        self.assert_template_used('publisher/register-name.html')


class PostRegisterNamePageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = '/account/register-name'

        super().setUp(
            snap_name=None,
            endpoint_url=endpoint_url,
            method_endpoint='POST')


class PostRegisterNamePage(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        endpoint_url = '/account/register-name'
        api_url = (
            'https://dashboard.snapcraft.io/dev/api/'
            'register-name/')

        data = {
            'snap-name': 'test-snap'
        }

        super().setUp(
            snap_name=None,
            api_url=api_url,
            endpoint_url=endpoint_url,
            method_api='POST',
            method_endpoint='POST',
            data=data)

    @responses.activate
    def test_post_no_data(self):
        response = self.client.post(
            self.endpoint_url,
        )

        assert response.status_code == 302
        assert response.location == self._get_location()

    @responses.activate
    def test_post_snap_name(self):
        responses.add(
            responses.POST, self.api_url,
            json={}, status=200)

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
            b'{"snap_name": "test-snap"}',
            called.request.body)

        assert response.status_code == 302
        assert response.location == self._get_location()

    @responses.activate
    def test_post_store(self):
        responses.add(
            responses.POST, self.api_url,
            json={}, status=200)

        self.data['store'] = 'store'
        response = self.client.post(
            self.endpoint_url,
            data=self.data,
        )

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))
        self.assertEqual(
            self.api_url,
            called.request.url)
        self.assertIn(
            b'"snap_name": "test-snap"',
            called.request.body)
        self.assertIn(
            b'"store": "store"',
            called.request.body)

        assert response.status_code == 302
        assert response.location == self._get_location()

    @responses.activate
    def test_post_private(self):
        responses.add(
            responses.POST, self.api_url,
            json={}, status=200)

        self.data['is_private'] = 'on'
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
        self.assertIn(
            b'"snap_name": "test-snap"',
            called.request.body)
        self.assertIn(
            b'"is_private": true',
            called.request.body)

        assert response.status_code == 302
        assert response.location == self._get_location()

    @responses.activate
    def test_post_registrant_comment(self):
        responses.add(
            responses.POST, self.api_url,
            json={}, status=200)

        self.data['registrant_comment'] = 'comment'
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
        self.assertIn(
            b'"snap_name": "test-snap"',
            called.request.body)
        self.assertIn(
            b'"registrant_comment": "comment"',
            called.request.body)

        assert response.status_code == 302
        assert response.location == self._get_location()

    @responses.activate
    def test_error_from_api(self):
        payload = {
            'error_list': [
                {
                    'code': 'error-code'
                },
            ]
        }
        responses.add(
            responses.POST, self.api_url,
            json=payload, status=400)

        self.client.post(
            self.endpoint_url,
            data=self.data,
        )

        self.assert_template_used('publisher/register-name.html')
        self.assert_context('errors', payload['error_list'])
