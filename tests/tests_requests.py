import unittest
from unittest.mock import patch

from requests.exceptions import ConnectionError, Timeout
from requests import Session as RequestsSession

import responses
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

    def test_recommendations_session_uses_shorter_timeout(self):
        session = requests.RecommendationsSession()

        with patch.object(
            RequestsSession,
            "request",
        ) as request:
            session.get("https://recommendations.snapcraft.io")

        request.assert_called_once_with(
            method="GET",
            url="https://recommendations.snapcraft.io",
            timeout=1,
            allow_redirects=True,
        )
