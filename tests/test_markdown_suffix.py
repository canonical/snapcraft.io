import unittest

import flask

from canonicalwebteam.markdown_response.converter import (
    convert_html_to_markdown,
)

from webapp.app import create_app
from webapp.handlers import markdown_url
from webapp.markdown_suffix import (
    STRIP_CLASSES,
    STRIP_ELEMENTS,
    add_suffix,
    strip_suffix,
)


class TestStripSuffix(unittest.TestCase):
    def test_plain_page(self):
        self.assertEqual(strip_suffix("/about.md"), "/about")

    def test_nested_page(self):
        self.assertEqual(strip_suffix("/about/publish.md"), "/about/publish")

    def test_index_is_the_homepage(self):
        self.assertEqual(strip_suffix("/index.md"), "/")

    def test_index_under_a_directory(self):
        self.assertEqual(strip_suffix("/docs/index.md"), "/docs/")

    def test_bare_suffix_is_still_the_homepage(self):
        self.assertEqual(strip_suffix("/.md"), "/")

    def test_the_homepage_gets_index_md(self):
        self.assertEqual(add_suffix("/"), "/index.md")

    def test_a_directory_gets_index_md(self):
        self.assertEqual(add_suffix("/docs/"), "/docs/index.md")

    def test_add_suffix_round_trips(self):
        paths = ["/", "/about", "/about/publish", "/store/categories/games"]

        for path in paths:
            self.assertEqual(strip_suffix(add_suffix(path)), path)


class TestStrippedChrome(unittest.TestCase):
    def markdown(self, html):
        return convert_html_to_markdown(
            f'<div id="main-content">{html}</div>',
            strip_elements=STRIP_ELEMENTS,
            strip_classes=STRIP_CLASSES,
        )

    def test_tooltips_are_dropped(self):
        html = (
            "<p>Kept</p>" '<span class="p-tooltip__message">Hover text</span>'
        )

        self.assertNotIn("Hover text", self.markdown(html))

    def test_carousel_controls_are_dropped(self):
        html = (
            '<div class="p-carousel__buttons">'
            "<button>Previous</button><button>Next</button></div>"
        )

        self.assertEqual(self.markdown(html).strip(), "")

    def test_forms_and_widgets_are_dropped(self):
        html = "<form><label>Show architecture</label><select></select></form>"

        self.assertEqual(self.markdown(html).strip(), "")

    def test_marked_elements_are_dropped(self):
        html = "<p data-md-strip>Copy to clipboard</p><p>Kept</p>"

        self.assertEqual(self.markdown(html).strip(), "Kept")

    def test_content_survives(self):
        html = "<h1>spotify</h1><p>latest/stable 1.2.95</p>"
        markdown = self.markdown(html)

        self.assertIn("# spotify", markdown)
        self.assertIn("latest/stable 1.2.95", markdown)


class TestMarkdownSuffix(unittest.TestCase):
    def setUp(self):
        self.app = create_app(testing=True)
        self.client = self.app.test_client()

    def markdown(self, path):
        response = self.client.get(path)

        return response.status_code, response.headers["Content-Type"]

    def test_suffix_serves_markdown(self):
        paths = [
            "/index.md",
            "/.md",
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

    def test_pages_behind_login_have_no_markdown_version(self):
        for path in ["/snaps.md", "/account/snaps.md", "/validation-sets.md"]:
            status, _ = self.markdown(path)

            self.assertEqual(status, 404, path)

    def test_pages_behind_login_still_serve_html(self):
        self.assertNotEqual(self.client.get("/snaps").status_code, 404)

    def test_pages_behind_login_do_not_advertise_markdown(self):
        with self.app.test_request_context("/snaps"):
            self.assertIsNone(markdown_url(flask.request))

    def test_unknown_page_is_not_found(self):
        status, _ = self.markdown("/not-a-real-page-xyz.md")

        self.assertEqual(status, 404)

    def test_the_markdown_link_follows_the_spec(self):
        links = {
            "/": "https://snapcraft.io/index.md",
            "/about": "https://snapcraft.io/about.md",
        }

        for path, href in links.items():
            body = self.client.get(path).data.decode()

            self.assertIn(
                f'<link rel="alternate" type="text/markdown" href="{href}"',
                body,
            )
            self.assertIn(
                '<link rel="describedby" href="https://snapcraft.io/llms.txt"',
                body,
            )

    def test_content_anchor_is_present_on_every_page(self):
        for path in ["/", "/about", "/build", "/iot"]:
            body = self.client.get(path).data.decode()

            self.assertEqual(
                body.count('id="main-content"'),
                1,
                f"{path} needs exactly one content anchor",
            )
