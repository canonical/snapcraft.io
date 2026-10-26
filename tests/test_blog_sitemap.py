import unittest
from unittest.mock import patch

from requests.exceptions import ProxyError

from webapp.app import create_app


class FakeResponse:
    def __init__(self, status_code=200, posts=None, broken_json=False):
        self.status_code = status_code
        self._posts = posts or []
        self._broken_json = broken_json

    def json(self):
        if self._broken_json or self.status_code != 200:
            raise ValueError("invalid json")
        return self._posts


class TestBlogSitemap(unittest.TestCase):
    def setUp(self):
        self.app = create_app(testing=True)
        self.client = self.app.test_client()

    @patch("webapp.blog.views.requests.Session.get")
    def test_sitemap_handles_request_error(self, mock_get):
        mock_get.side_effect = ProxyError("Unable to connect to proxy")

        response = self.client.get("/blog/sitemap.xml")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"<urlset", response.data)

    @patch("webapp.blog.views.requests.Session.get")
    def test_sitemap_handles_invalid_json(self, mock_get):
        mock_get.return_value = FakeResponse(broken_json=True)

        response = self.client.get("/blog/sitemap.xml")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"<urlset", response.data)

    @patch("webapp.blog.views.requests.Session.get")
    def test_sitemap_handles_http_error_status(self, mock_get):
        mock_get.return_value = FakeResponse(status_code=502)

        response = self.client.get("/blog/sitemap.xml")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"<urlset", response.data)

    @patch("webapp.blog.views.requests.Session.get")
    def test_sitemap_lists_posts(self, mock_get):
        posts = [
            {
                "slug": "some-post",
                "date": "2026-10-01T00:00:00+00:00",
            }
        ]
        mock_get.side_effect = [
            FakeResponse(status_code=200, posts=posts),
            FakeResponse(status_code=400),
        ]

        response = self.client.get("/blog/sitemap.xml")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"some-post", response.data)
        self.assertEqual(mock_get.call_count, 2)
