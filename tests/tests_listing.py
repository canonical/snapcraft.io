import unittest
import responses

from tests.endpoint_testing import BaseTestCases


class ListingPageNotAuth(BaseTestCases.EndpointGetLoggedOut):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = '/account/snaps/{}/listing'.format(snap_name)

        super().setUp(snap_name, endpoint_url)


class GetListingPage(BaseTestCases.EndpointGetLoggedIn):
    def setUp(self):
        snap_name = "test-snap"

        api_url = 'https://dashboard.snapcraft.io/dev/api/snaps/info/{}'
        api_url = api_url.format(
            snap_name
        )
        endpoint_url = '/account/snaps/{}/listing'.format(snap_name)

        super().setUp(snap_name, api_url, endpoint_url)

    @responses.activate
    def test_page_not_found(self):
        payload = {
            'error_list': []
        }
        responses.add(
            responses.GET, self.api_url,
            json=payload, status=404)

        response = self.client.get(self.endpoint_url)

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.api_url,
            called.request.url)
        self.assertEqual(
            self.authorization,
            called.request.headers.get('Authorization'))

        assert response.status_code == 404
        self.assert_template_used('404.html')

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

        responses.add(
            responses.GET, self.api_url,
            json=payload, status=200)

        response = self.client.get(self.endpoint_url)

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.api_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        assert response.status_code == 200
        self.assert_template_used('publisher/listing.html')

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
        payload = {
            'snap_id': 'id',
            'snap_name': self.snap_name,
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

        responses.add(
            responses.GET, self.api_url,
            json=payload, status=200)

        response = self.client.get(self.endpoint_url)

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.api_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        assert response.status_code == 200
        self.assert_template_used('publisher/listing.html')

        self.assert_context('icon_url', 'this is a url')

    @responses.activate
    def test_screenshots(self):
        payload = {
            'snap_id': 'id',
            'snap_name': self.snap_name,
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

        responses.add(
            responses.GET, self.api_url,
            json=payload, status=200)

        response = self.client.get(self.endpoint_url)

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.api_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        assert response.status_code == 200
        self.assert_template_used('publisher/listing.html')

        self.assert_context('screenshot_urls', ['this is a url'])


if __name__ == '__main__':
    unittest.main()
