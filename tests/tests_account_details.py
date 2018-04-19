import unittest

import pymacaroons
import responses

from app import app
from flask_testing import TestCase
from modules.authentication import get_authorization_header


# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class AccountDetailsPage(TestCase):

    render_templates = False

    def create_app(self):
        app.config['WTF_CSRF_METHODS'] = []
        app.testing = True

        return app

    def _log_in(self, client):
        """Emulates test client login in the store.

        Fill current session with `openid`, `macaroon_root` and
        `macaroon_discharge`.

        Return the expected `Authorization` header for further verification in
        API requests.
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

    def test_account_not_logged_in(self):
        # `account` page redirects unauthenticated access to `login`
        # with the appropriate `next` path.
        response = self.client.get('/account/details')
        self.assertEqual(302, response.status_code)
        self.assertEqual(
            'http://localhost/login?next=/account/details',
            response.location)

    @responses.activate
    def test_account_logged_in(self):
        responses.add(
            responses.GET, 'https://dashboard.snapcraft.io/dev/api/account',
            json={}, status=200)

        authorization = self._log_in(self.client)
        response = self.client.get('/account/details')
        self.assertEqual(200, response.status_code)
        # Add pyQuery basic context checks

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            'https://dashboard.snapcraft.io/dev/api/account',
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))

        assert response.status_code == 200
        self.assert_template_used('publisher/account-details.html')
        self.assert_context('username', 'Toto')
        self.assert_context('displayname', 'El Toto')
        self.assert_context('email', 'testing@testing.com')
        self.assert_context('image', None)

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
            responses.GET, 'https://dashboard.snapcraft.io/dev/api/account',
            json=payload, status=403)

        authorization = self._log_in(self.client)
        response = self.client.get('/account/details')

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            'https://dashboard.snapcraft.io/dev/api/account',
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))

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
            responses.GET, 'https://dashboard.snapcraft.io/dev/api/account',
            json=payload, status=403)

        authorization = self._log_in(self.client)
        response = self.client.get('/account/details')

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            'https://dashboard.snapcraft.io/dev/api/account',
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))

        self.assertEqual(302, response.status_code)
        self.assertEqual(
            'http://localhost/account/username',
            response.location)

    @responses.activate
    def test_account_custom_error_logged_in(self):
        payload = {
            'error_list': [
                {
                    'code': 'custom-error',
                    'message': 'great message'
                }
            ]
        }
        responses.add(
            responses.GET, 'https://dashboard.snapcraft.io/dev/api/account',
            json=payload, status=403)

        authorization = self._log_in(self.client)
        response = self.client.get('/account/details')

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            'https://dashboard.snapcraft.io/dev/api/account',
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))

        assert response.status_code == 200
        self.assert_template_used('publisher/account-details.html')
        self.assert_context('error_list', payload['error_list'])

    @responses.activate
    def test_account_expired_macaroon_logged_in(self):
        responses.add(
            responses.GET, 'https://dashboard.snapcraft.io/dev/api/account',
            json={}, status=400,
            headers={'WWW-Authenticate': 'Macaroon needs_refresh=1'})
        responses.add(
            responses.POST, 'https://login.ubuntu.com/api/v2/tokens/refresh',
            json={'discharge_macaroon': 'macaroon'}, status=200)

        authorization = self._log_in(self.client)
        response = self.client.get('/account/details')

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            'https://dashboard.snapcraft.io/dev/api/account',
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))
        called = responses.calls[1]
        self.assertEqual(
            'https://login.ubuntu.com/api/v2/tokens/refresh',
            called.request.url)

        self.assertEqual(302, response.status_code)
        self.assertEqual(
            'http://localhost/account/details',
            response.location)

    @responses.activate
    def test_account_api_failure(self):
        responses.add(
            responses.GET, 'https://dashboard.snapcraft.io/dev/api/account',
            json={}, status=500)

        authorization = self._log_in(self.client)
        response = self.client.get('/account/details')
        self.assertEqual(200, response.status_code)

        self.assertEqual(1, len(responses.calls))
        [account_call] = responses.calls
        self.assertEqual(
            'https://dashboard.snapcraft.io/dev/api/account',
            account_call.request.url)
        self.assertEqual(
            authorization, account_call.request.headers.get('Authorization'))


if __name__ == '__main__':
    unittest.main()
