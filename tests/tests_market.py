import unittest
import requests

import pymacaroons
import responses

from app import app
from flask_testing import TestCase
from modules.authentication import get_authorization_header


# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class MarketPage(TestCase):

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
                'fullname': 'El Toto'
            }
            s['macaroon_root'] = root.serialize()
            s['macaroon_discharge'] = discharge.serialize()

        return get_authorization_header(
            root.serialize(), discharge.serialize())

    def test_snap_market_not_logged_in(self):
        # `snap-market` page redirects unauthenticated access to `login`
        # with the appropriate `next` path.
        response = self.client.get('/account/snaps/lxd/market')
        self.assertEqual(302, response.status_code)
        self.assertEqual(
            'http://localhost/login?next=/account/snaps/lxd/market',
            response.location)

    @responses.activate
    def test_timeout(self):
        snap_name = "test-snap"

        api_url = 'https://dashboard.snapcraft.io/dev/api/snaps/info/{}'
        api_url = api_url.format(
            snap_name
        )
        responses.add(
            responses.GET, api_url,
            body=requests.exceptions.Timeout(), status=504)

        authorization = self._log_in(self.client)
        endpoint_url = '/account/snaps/{}/market'.format(snap_name)
        response = self.client.get(endpoint_url)

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))

        assert response.status_code == 504

    @responses.activate
    def test_connection_error(self):
        snap_name = "test-snap"

        api_url = 'https://dashboard.snapcraft.io/dev/api/snaps/info/{}'
        api_url = api_url.format(
            snap_name
        )
        responses.add(
            responses.GET, api_url,
            body=requests.exceptions.ConnectionError(), status=500)

        authorization = self._log_in(self.client)
        endpoint_url = '/account/snaps/{}/market'.format(snap_name)
        response = self.client.get(endpoint_url)

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))

        assert response.status_code == 502

    @responses.activate
    def test_snap_not_found(self):
        snap_name = "test-snap"

        api_url = 'https://dashboard.snapcraft.io/dev/api/snaps/info/{}'
        api_url = api_url.format(
            snap_name
        )
        payload = {
            'error_list': []
        }
        responses.add(
            responses.GET, api_url,
            json=payload, status=404)

        authorization = self._log_in(self.client)
        endpoint_url = '/account/snaps/{}/market'.format(snap_name)
        response = self.client.get(endpoint_url)

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))

        assert response.status_code == 404
        self.assert_template_used('404.html')

    @responses.activate
    def test_broken_json(self):
        # To test this I return no json from the server, this makes the call
        # to the function response.json() raise a ValueError exception
        snap_name = "test-snap"

        api_url = 'https://dashboard.snapcraft.io/dev/api/snaps/info/{}'
        api_url = api_url.format(
            snap_name
        )
        responses.add(
            responses.GET, api_url,
            status=500)

        authorization = self._log_in(self.client)
        endpoint_url = '/account/snaps/{}/market'.format(snap_name)
        response = self.client.get(endpoint_url)

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))

        assert response.status_code == 502

    @responses.activate
    def test_unknown_error(self):
        snap_name = "test-snap"

        api_url = 'https://dashboard.snapcraft.io/dev/api/snaps/info/{}'
        api_url = api_url.format(
            snap_name
        )
        responses.add(
            responses.GET, api_url,
            json={}, status=500)

        authorization = self._log_in(self.client)
        endpoint_url = '/account/snaps/{}/market'.format(snap_name)
        response = self.client.get(endpoint_url)

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))

        assert response.status_code == 502

    @responses.activate
    def test_error_4xx(self):
        snap_name = "test-snap"

        api_url = 'https://dashboard.snapcraft.io/dev/api/snaps/info/{}'
        api_url = api_url.format(
            snap_name
        )
        payload = {
            'error_list': []
        }
        responses.add(
            responses.GET, api_url,
            json=payload, status=400)

        authorization = self._log_in(self.client)
        endpoint_url = '/account/snaps/{}/market'.format(snap_name)
        response = self.client.get(endpoint_url)

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))

        assert response.status_code == 502

    @responses.activate
    def test_expired_macaroon(self):
        # To test this I return no json from the server, this makes the call
        # to the function response.json() raise a ValueError exception
        snap_name = "test-snap"

        api_url = 'https://dashboard.snapcraft.io/dev/api/snaps/info/{}'
        api_url = api_url.format(
            snap_name
        )
        responses.add(
            responses.GET, api_url,
            json={}, status=500,
            headers={'WWW-Authenticate': 'Macaroon needs_refresh=1'})
        responses.add(
            responses.POST, 'https://login.ubuntu.com/api/v2/tokens/refresh',
            json={'discharge_macaroon': 'macaroon'}, status=200)

        authorization = self._log_in(self.client)
        endpoint_url = '/account/snaps/{}/market'.format(snap_name)
        response = self.client.get(endpoint_url)

        self.assertEqual(2, len(responses.calls))

        called = responses.calls[0]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))
        called = responses.calls[1]
        self.assertEqual(
            'https://login.ubuntu.com/api/v2/tokens/refresh',
            called.request.url)

        assert response.status_code == 302
        assert response.location == 'http://localhost{}'.format(endpoint_url)

    @responses.activate
    def test_account_logged_in(self):
        snap_name = "test-snap"

        payload = {
            'snap_id': 'id',
            'snap_name': snap_name,
            'title': 'Snap title',
            'summary': 'This is a summary',
            'description': 'This is a description',
            'license': 'license',
            'media': [],
            'publisher': {
                'display-name': 'The publisher'
            },
            'contact': 'contact adress',
            'website': 'website_url',
            'public_metrics_enabled': True,
            'public_metrics_blacklist': True,
        }

        api_url = 'https://dashboard.snapcraft.io/dev/api/snaps/info/{}'
        api_url = api_url.format(
            snap_name
        )
        responses.add(
            responses.GET, api_url,
            json=payload, status=200)

        authorization = self._log_in(self.client)
        endpoint_url = '/account/snaps/{}/market'.format(snap_name)
        response = self.client.get(endpoint_url)

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))

        assert response.status_code == 200
        self.assert_template_used('publisher/market.html')

        self.assert_context('snap_id', 'id')
        self.assert_context('snap_name', snap_name)
        self.assert_context('snap_title', 'Snap title')
        self.assert_context('summary', 'This is a summary')
        self.assert_context('description', 'This is a description')
        self.assert_context('license', 'license')
        self.assert_context('icon_url', None)
        self.assert_context('publisher_name', 'The publisher')
        self.assert_context('screenshot_urls', [])
        self.assert_context('contact', 'contact adress')
        self.assert_context('website', 'website_url')
        self.assert_context('public_metrics_enabled', True)
        self.assert_context('public_metrics_blacklist', True)

    @responses.activate
    def test_icon(self):
        snap_name = "test-snap"

        payload = {
            'snap_id': 'id',
            'snap_name': snap_name,
            'title': 'Snap title',
            'summary': 'This is a summary',
            'description': 'This is a description',
            'license': 'license',
            'media': [
                {
                    'url': 'this is a url',
                    'type': 'icon'
                }
            ],
            'publisher': {
                'display-name': 'The publisher'
            },
            'contact': 'contact adress',
            'website': 'website_url',
            'public_metrics_enabled': True,
            'public_metrics_blacklist': True,
        }

        api_url = 'https://dashboard.snapcraft.io/dev/api/snaps/info/{}'
        api_url = api_url.format(
            snap_name
        )
        responses.add(
            responses.GET, api_url,
            json=payload, status=200)

        authorization = self._log_in(self.client)
        endpoint_url = '/account/snaps/{}/market'.format(snap_name)
        response = self.client.get(endpoint_url)

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))

        assert response.status_code == 200
        self.assert_template_used('publisher/market.html')

        self.assert_context('icon_url', 'this is a url')

    @responses.activate
    def test_screenshots(self):
        snap_name = "test-snap"

        payload = {
            'snap_id': 'id',
            'snap_name': snap_name,
            'title': 'Snap title',
            'summary': 'This is a summary',
            'description': 'This is a description',
            'license': 'license',
            'media': [
                {
                    'url': 'this is a url',
                    'type': 'screenshot'
                }
            ],
            'publisher': {
                'display-name': 'The publisher'
            },
            'contact': 'contact adress',
            'website': 'website_url',
            'public_metrics_enabled': True,
            'public_metrics_blacklist': True,
        }

        api_url = 'https://dashboard.snapcraft.io/dev/api/snaps/info/{}'
        api_url = api_url.format(
            snap_name
        )
        responses.add(
            responses.GET, api_url,
            json=payload, status=200)

        authorization = self._log_in(self.client)
        endpoint_url = '/account/snaps/{}/market'.format(snap_name)
        response = self.client.get(endpoint_url)

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            authorization, called.request.headers.get('Authorization'))

        assert response.status_code == 200
        self.assert_template_used('publisher/market.html')

        self.assert_context('screenshot_urls', ['this is a url'])


if __name__ == '__main__':
    unittest.main()
