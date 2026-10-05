import unittest
from unittest.mock import patch

from requests.exceptions import ProxyError

from webapp.app import create_app


class TestBlogSitemap(unittest.TestCase):
    def setUp(self):
        self.app = create_app(testing=True)
        self.client = self.app.test_client()

    @patch("webapp.blog.views.session.get")
    def test_sitemap_handles_request_error(self, mock_get):
        mock_get.side_effect = ProxyError("Unable to connect to proxy")

        response = self.client.get("/blog/sitemap.xml")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"<urlset", response.data)

    @patch("webapp.blog.views.session.get")
    def test_sitemap_handles_invalid_json(self, mock_get):
        class FakeResponse:
            status_code = 200

            def json(self):
                raise ValueError("invalid json")

        mock_get.return_value = FakeResponse()

        response = self.client.get("/blog/sitemap.xml")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"<urlset", response.data)

    @patch("webapp.blog.views.session.get")
    def test_sitemap_lists_posts(self, mock_get):
        class FakeResponse:
            status_code = 400

        mock_get.side_effect = [
            type(
                "Response",
                (),
                {
                    "status_code": 200,
                    "json": lambda self: [
                        {
                            "slug": "some-post",
                            "date": "2026-10-01T00:00:00+00:00",
                        }
                    ],
                },
            )(),
            FakeResponse(),
        ]

        response = self.client.get("/blog/sitemap.xml")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"some-post", response.data)
        self.assertEqual(mock_get.call_count, 2)
