import requests_cache
import responses
import unittest

from webapp.api import requests


class RequestsCacheTest(unittest.TestCase):

    def test_class_inheritence(self):
        self.assertFalse(
            issubclass(requests.Session, requests_cache.CachedSession)
        )
        self.assertTrue(
            issubclass(requests.CachedSession, requests_cache.CachedSession)
        )

    @responses.activate
    def test_cache_enabled(self):
        test_url = 'https://api.snapcraft.io'
        session = requests.CachedSession()

        responses.add(
            responses.GET,
            test_url,
            body='test_string',
            status=200,
        )
        response = session.get(test_url)
        self.assertEqual(response.text, 'test_string')

        with responses.RequestsMock(
            assert_all_requests_are_fired=False
        ) as rsps:
            rsps.add(
                responses.GET,
                test_url,
                body='Server error',
                status=500,
            )
            response = session.get(test_url)
            self.assertEqual(response.text, 'test_string')

    @responses.activate
    def test_cache_disabled(self):
        test_url = 'https://dashboard.snapcraft.io'
        session = requests.Session()

        responses.add(
            responses.GET,
            test_url,
            body='test_string',
            status=200,
        )
        response = session.get(test_url)
        self.assertEqual(response.text, 'test_string')

        responses.replace(
            responses.GET,
            test_url,
            body='Server error',
            status=500,
        )
        response = session.get(test_url)
        self.assertNotEqual(response.text, 'test_string')
