import unittest

import responses
from flask_testing import TestCase

from webapp.app import create_app
from webapp.api import google, requests

# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class TestSearchViewNoApiKey(TestCase):
    def setUp(self):
        google.search_session = requests.Session()

    def create_app(self):
        test_app = create_app(testing=True)
        test_app.config["SEARCH_API_KEY"] = None
        return test_app

    def test_no_api_key_500(self):
        with self.assertRaises(google.NoAPIKeyError):
            self.client.get("/docs/search?q=test")


class TestSearchView(TestCase):
    def create_app(self):
        test_app = create_app(testing=True)
        test_app.config["SEARCH_API_KEY"] = "test"
        return test_app

    @responses.activate
    def test_search_no_results(self):
        responses.add(
            responses.GET,
            (
                "https://www.googleapis.com/customsearch/v1"
                "?key=test"
                "&cx=009048213575199080868:i3zoqdwqk8o"
                "&q=nothing"
                "&start=1"
                "&num=10"
                "&siteSearch=snapcraft.io"
            ),
            json={"items": []},
        )

        response = self.client.get("/docs/search?q=nothing")
        self.assert200(response)
        self.assertContext("query", "nothing")
        self.assertContext("start", 1)
        self.assertContext("num", 10)
        self.assertContext("results", {"entries": []})

    @responses.activate
    def test_search(self):
        responses.add(
            responses.GET,
            (
                "https://www.googleapis.com/customsearch/v1"
                "?key=test"
                "&cx=009048213575199080868:i3zoqdwqk8o"
                "&q=everything"
                "&start=1"
                "&num=10"
                "&siteSearch=snapcraft.io"
            ),
            json={
                "items": [{"htmlSnippet": "<br>\n"}, {"htmlSnippet": "<br>\n"}]
            },
        )

        response = self.client.get("/docs/search?q=everything")
        self.assert200(response)
        self.assertContext("query", "everything")
        self.assertContext("start", 1)
        self.assertContext("num", 10)
        self.assertContext(
            "results", {"entries": [{"htmlSnippet": ""}, {"htmlSnippet": ""}]}
        )


if __name__ == "__main__":
    unittest.main()
