import responses
import unittest
from requests.exceptions import ConnectionError, Timeout

from webapp.api import requests
from webapp.api.exceptions import ApiConnectionError, ApiTimeoutError


class RequestsCacheTest(unittest.TestCase):
    @responses.activate
    def test_connection_api_error(self):
        test_url = "https://snapcraft.io"
        session = requests.Session()
        responses.add(responses.GET, test_url, body=ConnectionError())
        with self.assertRaises(ApiConnectionError):
            session.get(test_url)

    @responses.activate
    def test_timeout_api_error(self):
        test_url = "https://snapcraft.io"
        session = requests.Session()
        responses.add(responses.GET, test_url, body=Timeout())
        with self.assertRaises(ApiTimeoutError):
            session.get(test_url)
