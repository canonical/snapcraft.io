import unittest
import responses
from tests.endpoint_testing import BaseTestCases

# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class AccountSnapsNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = '/account/snaps'

        super().setUp(None, endpoint_url)


class AccountSnapsPageErrorsHandling(
        BaseTestCases.EndpointLoggedInErrorHandling):
    def setUp(self):
        api_url = 'https://dashboard.snapcraft.io/dev/api/account'
        endpoint_url = '/account/snaps'

        super().setUp(None, endpoint_url, api_url)


class AccountSnapsPage(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        api_url = 'https://dashboard.snapcraft.io/dev/api/account'
        endpoint_url = '/account/snaps'

        super().setUp(None, endpoint_url, api_url)

    @responses.activate
    def test_no_snaps(self):
        payload = {
            'snaps': {
                '16': {}
            }
        }
        responses.add(
            responses.GET, self.api_url,
            json=payload, status=200)

        response = self.client.get(self.endpoint_url)
        self.assertEqual(200, response.status_code)
        # Add pyQuery basic context checks

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.api_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        assert response.status_code == 200
        self.assert_template_used('publisher/account-snaps.html')
        self.assert_context('current_user', 'Toto')
        self.assert_context('snaps', {})
        self.assert_context('registered_snaps', {})

    @responses.activate
    def test_registered_snaps(self):
        payload = {
            'snaps': {
                '16': {
                    'test': {
                        'snap-name': 'test',
                        'latest_revisions': []
                    }
                }
            }
        }
        responses.add(
            responses.GET, self.api_url,
            json=payload, status=200)

        response = self.client.get(self.endpoint_url)
        self.assertEqual(200, response.status_code)
        # Add pyQuery basic context checks

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.api_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        assert response.status_code == 200
        self.assert_template_used('publisher/account-snaps.html')
        self.assert_context('current_user', 'Toto')
        self.assert_context('snaps', {})
        self.assert_context('registered_snaps', payload['snaps']['16'])

    @responses.activate
    def test_uploaded_snaps(self):
        payload = {
            'snaps': {
                '16': {
                    'test': {
                        'snap-name': 'test',
                        'latest_revisions': [{'test': 'test'}]
                    }
                }
            }
        }
        responses.add(
            responses.GET, self.api_url,
            json=payload, status=200)

        response = self.client.get(self.endpoint_url)
        self.assertEqual(200, response.status_code)
        # Add pyQuery basic context checks

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.api_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        assert response.status_code == 200
        self.assert_template_used('publisher/account-snaps.html')
        self.assert_context('current_user', 'Toto')
        self.assert_context('snaps', payload['snaps']['16'])
        self.assert_context('registered_snaps', {})

    @responses.activate
    def test_uploaded_snaps_registered_snaps(self):
        payload = {
            'snaps': {
                '16': {
                    'test': {
                        'snap-name': 'test',
                        'latest_revisions': [{'test': 'test'}]
                    },
                    'test2': {
                        'snap-name': 'test2',
                        'latest_revisions': []
                    }
                }
            }
        }
        responses.add(
            responses.GET, self.api_url,
            json=payload, status=200)

        response = self.client.get(self.endpoint_url)
        self.assertEqual(200, response.status_code)
        # Add pyQuery basic context checks

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.api_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        registered_snaps = {
            'test2': {
                'snap-name': 'test2',
                'latest_revisions': []
            }
        }

        uploaded_snaps = {
            'test': {
                 'snap-name': 'test',
                 'latest_revisions': [{'test': 'test'}]
             }
        }

        assert response.status_code == 200
        self.assert_template_used('publisher/account-snaps.html')
        self.assert_context('current_user', 'Toto')
        self.assert_context('snaps', uploaded_snaps)
        self.assert_context('registered_snaps', registered_snaps)


if __name__ == '__main__':
    unittest.main()
