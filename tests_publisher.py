import unittest

import pymacaroons
import responses

from app import app
from flask_testing import TestCase
from modules.authentication import get_authorization_header


# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class PublisherPage(TestCase):

    render_templates = False

    def create_app(self):
        app.config['WTF_CSRF_METHODS'] = []
        app.testing = True

        return app

    def test_account(self):
        """
        Naive check that the basic redirects to the authentication system
        are working for the /account page
        """

        local_redirect = self.client.get("/account")
        redirect_url = "http://localhost/login?next=/account"
        assert local_redirect.status_code == 302
        assert local_redirect.headers.get('Location') == redirect_url

        ext_redirect = self.client.get('/login?next=/account')
        ext2_redirect = self.client.get('/login?next=/account')
        assert ext_redirect.status_code == 302
        assert ext2_redirect.status_code == 302
        assert 'login.ubuntu.com' in ext_redirect.headers.get('Location')
        assert 'login.ubuntu.com' in ext2_redirect.headers.get('Location')

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
                'fullname': 'El Toto'
            }
            s['macaroon_root'] = root.serialize()
            s['macaroon_discharge'] = discharge.serialize()

        return get_authorization_header(
            root.serialize(), discharge.serialize())

    def test_account_not_logged_in(self):
        # `account` page redirects unauthenticated access to `login`
        # with the appropriate `next` path.
        response = self.client.get('/account')
        self.assertEqual(302, response.status_code)
        self.assertEqual(
            'http://localhost/login?next=/account',
            response.location)

    def test_snap_market_not_logged_in(self):
        # `snap-market` page redirects unauthenticated access to `login`
        # with the appropriate `next` path.
        response = self.client.get('/account/snaps/lxd/market')
        self.assertEqual(302, response.status_code)
        self.assertEqual(
            'http://localhost/login?next=/account/snaps/lxd/market',
            response.location)

    def test_snap_measure_not_logged_in(self):
        # `snap-measure` page redirects unauthenticated access to `login`
        # with the appropriate `next` path.
        response = self.client.get('/account/snaps/lxd/measure')
        self.assertEqual(302, response.status_code)
        self.assertEqual(
            'http://localhost/login?next=/account/snaps/lxd/measure',
            response.location)

    def test_username_not_logged_in(self):
        # `snap-measure` page redirects unauthenticated access to `login`
        # with the appropriate `next` path.
        response = self.client.get('/account/username')
        self.assertEqual(302, response.status_code)
        self.assertEqual(
            'http://localhost/login?next=/account/username',
            response.location)

    def test_agreeement_not_logged_in(self):
        # `snap-measure` page redirects unauthenticated access to `login`
        # with the appropriate `next` path.
        response = self.client.get('/account/agreement')
        self.assertEqual(302, response.status_code)
        self.assertEqual(
            'http://localhost/login?next=/account/agreement',
            response.location)

    # /account endpoint
    # ===
    @responses.activate
    def test_account_logged_in(self):
        # Users logged-in can access they account page.
        snaps = {
            'foo': {
                'icon_url': None,
                'snap_id': 'snap-id',
                'private': False,
                'uploaded': False,
            }
        }

        payload = {
            'username': 'Toto',
            'displayname': 'El Toto',
            'email': 'testing@testing.com',
            'snaps': {
                '16': snaps
            }
        }
        responses.add(
            responses.GET, 'https://dashboard.snapcraft.io/dev/api/account',
            json=payload, status=200)

        authorization = self._log_in(self.client)
        response = self.client.get('/account')
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
        self.assert_template_used('account.html')
        self.assert_context('username', 'Toto')
        self.assert_context('displayname', 'El Toto')
        self.assert_context('email', 'testing@testing.com')
        self.assert_context('snaps', snaps)
        self.assert_context('image', None)
        self.assert_context('error_list', [])

    @responses.activate
    def test_account_not_signed_agreement_logged_in(self):
        # Users logged-in can access they account page.
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
        response = self.client.get('/account')

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
        # Users logged-in can access they account page.
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
        response = self.client.get('/account')

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
        # Users logged-in can access they account page.
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
        response = self.client.get('/account')

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            'https://dashboard.snapcraft.io/dev/api/account',
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))

        assert response.status_code == 200
        self.assert_template_used('account.html')
        self.assert_context('error_list', payload['error_list'])

    @responses.activate
    def test_account_expired_macaroon_logged_in(self):
        # Users logged-in can access they account page.
        responses.add(
            responses.GET, 'https://dashboard.snapcraft.io/dev/api/account',
            json={}, status=400,
            headers={'WWW-Authenticate': 'Macaroon needs_refresh=1'})
        responses.add(
            responses.POST, 'https://login.ubuntu.com/api/v2/tokens/refresh',
            json={'discharge_macaroon': 'macaroon'}, status=200)

        authorization = self._log_in(self.client)
        response = self.client.get('/account')

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
            'http://localhost/account',
            response.location)

    # /account/username endpoint
    # ===
    @responses.activate
    def test_username_logged_in(self):
        self._log_in(self.client)
        response = self.client.get("/account/username")

        assert response.status_code == 200
        self.assert_template_used('username.html')

    @responses.activate
    def test_post_username_logged_in(self):
        responses.add(
            responses.PATCH, 'https://dashboard.snapcraft.io/dev/api/account',
            json={}, status=204)

        authorization = self._log_in(self.client)
        response = self.client.post(
            '/account/username',
            data={
                'username': 'toto'
            },
        )

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            'https://dashboard.snapcraft.io/dev/api/account',
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))
        self.assertEqual(
            called.response.json(),
            {},
        )
        self.assertEqual(
            b'{"short_namespace": "toto"}',
            called.request.body
            )

        self.assertEqual(302, response.status_code)
        self.assertEqual(
            'http://localhost/account',
            response.location)

    @responses.activate
    def test_post_no_username_logged_in(self):
        self._log_in(self.client)
        response = self.client.post(
            '/account/username',
        )

        self.assertEqual(0, len(responses.calls))

        self.assertEqual(302, response.status_code)
        self.assertEqual(
            'http://localhost/account/username',
            response.location)

    @responses.activate
    def test_post_bad_username_logged_in(self):
        payload = {
            'error_list': [
                {
                    'code': 'custom-error',
                    'message': 'great message'
                }
            ]
        }
        responses.add(
            responses.PATCH, 'https://dashboard.snapcraft.io/dev/api/account',
            json=payload, status=400)

        authorization = self._log_in(self.client)
        response = self.client.post(
            '/account/username',
            data={
                'username': 'toto'
            },
        )

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            'https://dashboard.snapcraft.io/dev/api/account',
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))
        self.assertEqual(
            b'{"short_namespace": "toto"}',
            called.request.body
        )

        assert response.status_code == 200
        self.assert_template_used('username.html')
        self.assert_context('username', 'toto')
        self.assert_context('error_list', payload['error_list'])

    # /account/agreement endpoint
    # ===
    @responses.activate
    def test_agreement_logged_in(self):
        self._log_in(self.client)
        response = self.client.get("/account/agreement")

        assert response.status_code == 200
        self.assert_template_used('developer_programme_agreement.html')

    @responses.activate
    def test_post_agreement_logged_in(self):
        responses.add(
            responses.POST,
            'https://dashboard.snapcraft.io/dev/api/agreement/',
            json={}, status=200)

        authorization = self._log_in(self.client)
        response = self.client.post(
            '/account/agreement',
            data={
                'i_agree': 'on'
            },
        )

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            'https://dashboard.snapcraft.io/dev/api/agreement/',
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))
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
    def test_post_agreement_off_logged_in(self):
        self._log_in(self.client)
        response = self.client.post(
            '/account/agreement',
            data={
                'i_agree': 'off'
            },
        )

        self.assertEqual(302, response.status_code)
        self.assertEqual(
            'http://localhost/account/agreement',
            response.location)


if __name__ == '__main__':
    unittest.main()
