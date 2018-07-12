import responses
from tests.publisher.endpoint_testing import BaseTestCases


class GetRegisterNamePageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = '/account/register-snap'
        super().setUp(
            snap_name=None,
            endpoint_url=endpoint_url)


class GetRegisterNamePage(BaseTestCases.BaseAppTesting):
    def setUp(self):
        endpoint_url = '/account/register-snap'
        super().setUp(
            snap_name=None,
            api_url=None,
            endpoint_url=endpoint_url)

    @responses.activate
    def test_register_name_logged_in(self):
        self._log_in(self.client)
        response = self.client.get(self.endpoint_url)

        assert response.status_code == 200
        self.assert_template_used('publisher/register-snap.html')


class GetReserveNamePage(BaseTestCases.BaseAppTesting):
    def setUp(self):
        endpoint_url = (
            '/account/register-snap'
            '?snap_name=test-snap&is_private=False&conflict=True')
        super().setUp(
            snap_name=None,
            api_url=None,
            endpoint_url=endpoint_url)

    @responses.activate
    def test_reserve_name_logged_in(self):
        self._log_in(self.client)
        response = self.client.get(self.endpoint_url)

        assert response.status_code == 200
        self.assert_template_used('publisher/register-snap.html')
        self.assert_context('snap_name', 'test-snap')
        self.assert_context('is_private', False)
        self.assert_context('conflict', True)


class PostRegisterNamePageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = '/account/register-snap'

        super().setUp(
            snap_name=None,
            endpoint_url=endpoint_url,
            method_endpoint='POST')


class PostRegisterNamePage(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        endpoint_url = '/account/register-snap'
        api_url = (
            'https://dashboard.snapcraft.io/dev/api/'
            'register-snap/')

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
        self.assertEqual(response.location, 'http://localhost/account/')

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
        self.assertEqual(response.location, 'http://localhost/account/')

    @responses.activate
    def test_post_private(self):
        responses.add(
            responses.POST, self.api_url,
            json={}, status=200)

        self.data['is_private'] = 'private'
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
        self.assertEqual(response.location, 'http://localhost/account/')

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
        self.assertEqual(response.location, 'http://localhost/account/')

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

        self.assert_template_used('publisher/register-snap.html')
        self.assert_context('errors', payload['error_list'])

    @responses.activate
    def test_name_already_registered(self):
        payload = {
            'error_list': [
                {
                    'code': 'already_registered'
                },
            ]
        }
        responses.add(
            responses.POST, self.api_url,
            json=payload, status=409)

        response = self.client.post(
            self.endpoint_url,
            data=self.data,
        )

        assert response.status_code == 302
        self.assertIn(
            'snap_name=test-snap',
            response.location)
        self.assertIn(
            'is_private=False',
            response.location)
        self.assertIn(
            'http://localhost/account/register-snap',
            response.location)

    @responses.activate
    def test_claim_dispute(self):
        payload = {
            'error_list': [
                {
                    'code': 'already_claimed'
                },
            ]
        }
        responses.add(
            responses.POST, self.api_url,
            json=payload, status=409)

        response = self.client.post(
            self.endpoint_url,
            data=self.data,
        )

        assert response.status_code == 302
        self.assertEqual(response.location, 'http://localhost/account/')
