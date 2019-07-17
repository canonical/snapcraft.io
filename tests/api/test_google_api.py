import unittest

import responses

from webapp.api import google, requests

# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class TestGoogleSearchApi(unittest.TestCase):
    def setUp(self):
        google.search_session = requests.Session()

    @responses.activate
    def test_replace_line_breaks(self):
        responses.add(
            responses.GET,
            (
                "https://www.googleapis.com/customsearch/v1"
                "?key=key&cx=cx&q=q&start=start&num=num"
                "&siteSearch=snapcraft.io"
            ),
            json={
                "items": [{"htmlSnippet": "<br>\n"}, {"htmlSnippet": "<br>\n"}]
            },
        )

        results = google.get_search_results(
            "key",
            "https://www.googleapis.com/customsearch/v1?",
            "cx",
            "q",
            "start",
            "num",
        )

        self.assertEqual(
            {"entries": [{"htmlSnippet": ""}, {"htmlSnippet": ""}]}, results
        )

    def test_raise_no_api_key_error(self):
        with self.assertRaises(google.NoAPIKeyError):
            google.get_search_results(
                None,
                "https://www.googleapis.com/customsearch/v1?",
                "cx",
                "q",
                "start",
                "num",
            )
