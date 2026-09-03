import unittest

from webapp.app import create_app
from webapp.markdown_suffix import add_suffix, strip_suffix


class TestStripSuffix(unittest.TestCase):
    def test_plain_page(self):
        self.assertEqual(strip_suffix("/about.md"), "/about")

    def test_nested_page(self):
        self.assertEqual(strip_suffix("/about/publish.md"), "/about/publish")

    def test_bare_suffix_is_the_homepage(self):
        self.assertEqual(strip_suffix("/.md"), "/")

    def test_add_suffix_round_trips(self):
        for path in ["/about", "/about/publish", "/store/categories/games"]:
            self.assertEqual(strip_suffix(add_suffix(path)), path)


class TestMarkdownSuffix(unittest.TestCase):
    def setUp(self):
        self.client = create_app(testing=True).test_client()

    def markdown(self, path):
        response = self.client.get(path)

        return response.status_code, response.headers["Content-Type"]

    def test_suffix_serves_markdown(self):
        paths = [
            "/about.md",
            "/about/publish.md",
            "/build.md",
            "/inkscape.md",
        ]

        for path in paths:
            status, content_type = self.markdown(path)

            self.assertEqual(status, 200, path)
            self.assertIn("text/markdown", content_type, path)

    def test_markdown_is_cached_for_longer_than_the_site_default(self):
        headers = self.client.get("/about.md").headers

        self.assertIn("max-age=3600", headers["Cache-Control"])

    def test_pages_are_still_html_without_the_suffix(self):
        status, content_type = self.markdown("/about")

        self.assertEqual(status, 200)
        self.assertIn("text/html", content_type)

    def test_unknown_page_is_not_found(self):
        status, _ = self.markdown("/not-a-real-page-xyz.md")

        self.assertEqual(status, 404)

    def test_content_anchor_is_present_on_every_page(self):
        for path in ["/", "/about", "/build", "/iot"]:
            body = self.client.get(path).data.decode()

            self.assertEqual(
                body.count('id="main-content"'),
                1,
                f"{path} needs exactly one content anchor",
            )
