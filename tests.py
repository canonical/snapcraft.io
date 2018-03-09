#! /usr/bin/env python3

import json
import unittest

import pymacaroons
import responses
import urllib

import app
from modules.authentication import get_authorization_header


# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class WebAppTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.app.test_client()
        self.app.testing = True

    # Static pages
    # ==

    def test_homepage(self):
        self._check_basic_page('/')

    def test_storefront(self):
        response = self._check_basic_page('/store')
        assert 'type="search"' in str(response.data)

    def test_search(self):
        redirect = self._get_response('/search')
        assert redirect.status_code == 302
        assert redirect.headers.get('Location') == "http://localhost/store"

        response = self._check_basic_page('/search?q=livepatch')
        assert 'type="search"' in str(response.data)
        assert 'canonical-livepatch' in str(response.data)

    def test_not_found(self):
        response = self._get_response('/store/nothing-page')

        assert response.status_code == 404
        assert "Page not found" in str(response.data)

    # Account pages
    # ===

    def test_account(self):
        """
        Naive check that the basic redirects to the authentication system
        are working for the /account page
        """

        local_redirect = self._get_response('/account')
        redirect_url = "http://localhost/login?next=/account"
        assert local_redirect.status_code == 302
        assert local_redirect.headers.get('Location') == redirect_url

        ext_redirect = self._get_response('/login?next=/account')
        ext2_redirect = self._get_response('/login?next=/account')
        assert ext_redirect.status_code == 302
        assert ext2_redirect.status_code == 302
        assert 'login.ubuntu.com' in ext_redirect.headers.get('Location')
        assert 'login.ubuntu.com' in ext2_redirect.headers.get('Location')

    # Snap details pages
    # ==

    def test_canonical_livepatch_snap(self):
        response = self._check_basic_page('/canonical-livepatch')
        assert "canonical-livepatch" in str(response.data)

    def test_lxd_snap(self):
        response = self._check_basic_page('/lxd')
        assert "LXD" in str(response.data)

    def test_non_existent_snap(self):
        response = self._get_response('/non-existent-snap')

        assert response.status_code == 404
        assert "No snap named" in str(response.data)

    # Helper methods
    # ==

    def _get_response(self, uri):
        """
        Given a basic app path (e.g. '/page'), check that any trailing
        slashes are removed with a 302 redirect, and return the response
        for the principal URL
        """

        # Check trailing slashes trigger redirect
        parsed_uri = urllib.parse.urlparse(uri)
        slash_uri = urllib.parse.urlunparse(
            parsed_uri._replace(path=parsed_uri.path + '/'))
        redirect_response = self.app.get(slash_uri)
        assert redirect_response.status_code == 302

        url = "http://localhost" + uri
        assert redirect_response.headers.get('Location') == url

        return self.app.get(uri)

    def _check_basic_page(self, uri):
        """
        Check that a URI returns an HTML page that will redirect to remove
        slashes, returns a 200 and contains the standard footer text
        """

        if uri == '/':
            response = self.app.get(uri)
        else:
            response = self._get_response(uri)

        assert response.status_code == 200
        assert "Ubuntu and Canonical are registered" in str(response.data)

        return response


def _log_in(client):
    """Emulates test client login in the store.

    Fill current session with `openid`, `macaroon_root` and
    `macaroon_discharge`.

    Return the expected `Authorization` header for further verification in API
    requests.
    """
    # Basic root/discharge macaroons pair.
    root = pymacaroons.Macaroon('test', 'testing', 'a_key')
    root.add_third_party_caveat('3rd', 'a_caveat-key', 'a_ident')
    discharge = pymacaroons.Macaroon('3rd', 'a_ident', 'a_caveat_key')

    with client.session_transaction() as s:
        s['openid'] = 'fake'
        s['macaroon_root'] = root.serialize()
        s['macaroon_discharge'] = discharge.serialize()

    return get_authorization_header(root.serialize(), discharge.serialize())


class PublisherPagesTestCase(unittest.TestCase):
    """Integration tests for the publisher pages."""

    def setUp(self):
        app.testing = True
        self.client = app.app.test_client()

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

    @responses.activate
    def test_account_logged_in(self):
        # Users logged-in can access they account page.
        payload = {
            'namespace': 'testing',
            'snaps': {
                '16': {
                    'foo': {
                        'icon_url': None,
                        'snap_id': 'snap-id',
                        'private': False,
                        'uploaded': False,
                    }
                }
            }
        }
        responses.add(
            responses.GET, 'https://dashboard.snapcraft.io/dev/api/account',
            json=payload, status=200)

        authorization = _log_in(self.client)
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

    @responses.activate
    def test_account_api_failure(self):
        # Why verifying creds (`authentication.verify_response`) on a 500
        # from `account-info` that stil depend on a valid payload ?!?
        payload = {
            'namespace': 'testing',
            'snaps': {
                '16': {},
            }
        }
        responses.add(
            responses.GET, 'https://dashboard.snapcraft.io/dev/api/account',
            json=payload, status=500)
        responses.add(
            responses.POST,
            'https://dashboard.snapcraft.io/dev/api/acl/verify/',
            json={'account': 'test', 'allowed': True}, status=200)

        authorization = _log_in(self.client)
        response = self.client.get('/account')
        self.assertEqual(200, response.status_code)

        self.assertEqual(2, len(responses.calls))
        [account_call, verify_call] = responses.calls
        self.assertEqual(
            'https://dashboard.snapcraft.io/dev/api/account',
            account_call.request.url)
        self.assertEqual(
            authorization, account_call.request.headers.get('Authorization'))
        self.assertEqual(
            'https://dashboard.snapcraft.io/dev/api/acl/verify/',
            verify_call.request.url)
        self.assertEqual({
            'auth_data': {
                'authorization': authorization,
                'http_uri': (
                    'https://dashboard.snapcraft.io/dev/api/acl/verify/'),
                'http_method': 'GET'
            },
        }, json.loads(verify_call.request.body.decode('utf-8')))


if __name__ == '__main__':
    unittest.main()
