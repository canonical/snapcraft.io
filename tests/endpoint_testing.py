import requests

import pymacaroons
import responses

from app import app
from flask_testing import TestCase
from modules.authentication import get_authorization_header


# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class BaseTestCases:
    '''
    This class has a set of test classes that should be inherited by endpoint
    that have authentication.

    It is also used to avoid unittest to run this tests file.
    '''
    class BaseAppTesting(TestCase):
        render_templates = False

        def setUp(self, snap_name, api_url, endpoint_url):
            self.snap_name = snap_name
            self.api_url = api_url
            self.endpoint_url = endpoint_url

        def create_app(self):
            app.config['WTF_CSRF_METHODS'] = []
            app.testing = True

            return app

        def _get_location(self):
            return 'http://localhost{}'.format(self.endpoint_url)

        def _log_in(self, client):
            """Emulates test client login in the store.

            Fill current session with `openid`, `macaroon_root` and
            `macaroon_discharge`.

            Return the expected `Authorization` header for further verification
            in API requests.
            """
            # Basic root/discharge macaroons pair.
            root = pymacaroons.Macaroon('test', 'testing', 'a_key')
            root.add_third_party_caveat('3rd', 'a_caveat-key', 'a_ident')
            discharge = pymacaroons.Macaroon('3rd', 'a_ident', 'a_caveat_key')

            with client.session_transaction() as s:
                s['openid'] = {
                    'image': None,
                    'nickname': 'Toto',
                    'fullname': 'El Toto',
                    'email': 'testing@testing.com'
                }
                s['macaroon_root'] = root.serialize()
                s['macaroon_discharge'] = discharge.serialize()

            return get_authorization_header(
                root.serialize(), discharge.serialize())

    class EndpointGetLoggedOut(BaseAppTesting):
        def setUp(self, snap_name, endpoint_url):
            super().setUp(snap_name, None, endpoint_url)

        def test_access_not_logged_in(self):
            response = self.client.get(self.endpoint_url)
            self.assertEqual(302, response.status_code)
            self.assertEqual(
                'http://localhost/login?next={}'.format(self.endpoint_url),
                response.location)

    class EndpointPostLoggedOut(BaseAppTesting):
        def setUp(self, snap_name, endpoint_url):
            super().setUp(snap_name, None, endpoint_url)

        def test_access_not_logged_in(self):
            response = self.client.post(self.endpoint_url, data={})
            self.assertEqual(302, response.status_code)
            self.assertEqual(
                'http://localhost/login?next={}'.format(self.endpoint_url),
                response.location)

    class EndpointGetLoggedIn(BaseAppTesting):
        def setUp(self, snap_name, api_url, endpoint_url):
            super().setUp(snap_name, api_url, endpoint_url)
            self.authorization = self._log_in(self.client)

        @responses.activate
        def test_timeout(self):
            responses.add(
                responses.GET, self.api_url,
                body=requests.exceptions.Timeout(), status=504)

            response = self.client.get(self.endpoint_url)

            self.assertEqual(1, len(responses.calls))
            called = responses.calls[0]
            self.assertEqual(
                self.api_url,
                called.request.url)
            self.assertEqual(
                self.authorization,
                called.request.headers.get('Authorization'))

            assert response.status_code == 504

        @responses.activate
        def test_connection_error(self):
            responses.add(
                responses.GET, self.api_url,
                body=requests.exceptions.ConnectionError(), status=500)

            response = self.client.get(self.endpoint_url)

            self.assertEqual(1, len(responses.calls))
            called = responses.calls[0]
            self.assertEqual(
                self.api_url,
                called.request.url)
            self.assertEqual(
                self.authorization,
                called.request.headers.get('Authorization'))

            assert response.status_code == 502

        @responses.activate
        def test_broken_json(self):
            # To test this I return no json from the server, this makes the
            # call to the function response.json() raise a ValueError exception
            responses.add(
                responses.GET, self.api_url,
                status=500)

            response = self.client.get(self.endpoint_url)

            self.assertEqual(1, len(responses.calls))
            called = responses.calls[0]
            self.assertEqual(
                self.api_url,
                called.request.url)
            self.assertEqual(
                self.authorization,
                called.request.headers.get('Authorization'))

            assert response.status_code == 502

        @responses.activate
        def test_unknown_error(self):
            responses.add(
                responses.GET, self.api_url,
                json={}, status=500)

            response = self.client.get(self.endpoint_url)

            self.assertEqual(1, len(responses.calls))
            called = responses.calls[0]
            self.assertEqual(
                self.api_url,
                called.request.url)
            self.assertEqual(
                self.authorization,
                called.request.headers.get('Authorization'))

            assert response.status_code == 502

        @responses.activate
        def test_error_4xx(self):
            payload = {
                'error_list': []
            }
            responses.add(
                responses.GET, self.api_url,
                json=payload, status=400)

            response = self.client.get(self.endpoint_url)

            self.assertEqual(1, len(responses.calls))
            called = responses.calls[0]
            self.assertEqual(
                self.api_url,
                called.request.url)
            self.assertEqual(
                self.authorization,
                called.request.headers.get('Authorization'))

            assert response.status_code == 502

        @responses.activate
        def test_expired_macaroon(self):
            responses.add(
                responses.GET, self.api_url,
                json={}, status=500,
                headers={'WWW-Authenticate': 'Macaroon needs_refresh=1'})
            responses.add(
                responses.POST,
                'https://login.ubuntu.com/api/v2/tokens/refresh',
                json={'discharge_macaroon': 'macaroon'}, status=200)

            response = self.client.get(self.endpoint_url)

            self.assertEqual(2, len(responses.calls))

            called = responses.calls[0]
            self.assertEqual(
                self.api_url,
                called.request.url)
            self.assertEqual(
                self.authorization,
                called.request.headers.get('Authorization'))
            called = responses.calls[1]
            self.assertEqual(
                'https://login.ubuntu.com/api/v2/tokens/refresh',
                called.request.url)

            assert response.status_code == 302
            assert response.location == self._get_location()

        @responses.activate
        def test_account_not_signed_agreement_logged_in(self):
            payload = {
                'error_list': [
                    {
                        'code': 'user-not-ready',
                        'message': 'has not signed agreement'
                    }
                ]
            }
            responses.add(
                responses.GET, self.api_url,
                json=payload, status=403)

            response = self.client.get(self.endpoint_url)

            self.assertEqual(1, len(responses.calls))
            called = responses.calls[0]
            self.assertEqual(
                self.api_url,
                called.request.url)
            self.assertEqual(
                self.authorization,
                called.request.headers.get('Authorization'))

            self.assertEqual(302, response.status_code)
            self.assertEqual(
                'http://localhost/account/agreement',
                response.location)

        @responses.activate
        def test_account_no_username_logged_in(self):
            payload = {
                'error_list': [
                    {
                        'code': 'user-not-ready',
                        'message': 'missing namespace'
                    }
                ]
            }
            responses.add(
                responses.GET, self.api_url,
                json=payload, status=403)

            response = self.client.get(self.endpoint_url)

            self.assertEqual(1, len(responses.calls))
            called = responses.calls[0]
            self.assertEqual(
                self.api_url,
                called.request.url)
            self.assertEqual(
                self.authorization,
                called.request.headers.get('Authorization'))

            self.assertEqual(302, response.status_code)
            self.assertEqual(
                'http://localhost/account/username',
                response.location)
