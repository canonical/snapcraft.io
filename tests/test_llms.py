import re
import unittest

from werkzeug.exceptions import MethodNotAllowed, NotFound
from werkzeug.routing.exceptions import RequestRedirect

from webapp.app import create_app
from webapp.llms import store_llm

ROOT_CATCH_ALL = re.compile(r"/<[^>]+>")


class TestDiscoveredPages(unittest.TestCase):
    def setUp(self):
        self.app = create_app(testing=True)
        self.pages = store_llm.pages(self.app)
        self.paths = {page["path"] for page in self.pages}

    def test_the_marketing_pages_are_discovered(self):
        self.assertLessEqual(
            {
                "/about",
                "/about/contact-us",
                "/about/publish",
                "/account/agreement",
                "/build",
                "/store",
            },
            self.paths,
        )

    def test_every_page_has_a_title_and_a_description(self):
        for page in self.pages:
            self.assertTrue(page["title"], page["path"])
            self.assertTrue(page["description"], page["path"])

    def test_titles_come_from_the_template_metadata(self):
        page = next(page for page in self.pages if page["path"] == "/about")

        self.assertEqual(page["title"], "About Snaps")
        self.assertIn("Snaps are app packages", page["description"])

    def test_snap_and_publisher_pages_are_left_out(self):
        self.assertNotIn("/snaps", self.paths)
        self.assertNotIn("/validation-sets", self.paths)

    def test_noindex_pages_are_left_out(self):
        self.assertNotIn("/about/thank-you", self.paths)

    def test_redirects_and_machine_formats_are_left_out(self):
        for path in ["/community", "/create", "/account.json", "/sitemap.xml"]:
            self.assertNotIn(path, self.paths)

    def test_routes_rendering_the_same_page_are_listed_once(self):
        self.assertIn("/store", self.paths)
        self.assertNotIn("/explore", self.paths)
        self.assertNotIn("/search", self.paths)

    def test_every_page_matches_a_real_route(self):
        adapter = self.app.url_map.bind("snapcraft.io")
        unresolved = []

        for path in sorted(self.paths):
            try:
                rule, _ = adapter.match(path, return_rule=True)
            except RequestRedirect:
                continue
            except (NotFound, MethodNotAllowed):
                unresolved.append(path)
                continue

            if ROOT_CATCH_ALL.fullmatch(rule.rule):
                unresolved.append(path)

        self.assertEqual(
            unresolved, [], f"llms.txt links go nowhere: {unresolved}"
        )

    def test_pages_are_grouped_into_known_sections(self):
        sections = [
            group["section"] for group in store_llm.llms_sections(self.pages)
        ]

        self.assertIn("Main pages", sections)
        self.assertIn("Publishing a snap", sections)
        self.assertNotIn("Other pages", sections)
        self.assertEqual(sections[-1], "Optional")


class TestRoutes(unittest.TestCase):
    def setUp(self):
        self.app = create_app(testing=True)
        self.client = self.app.test_client()

    def test_llms_txt_lists_the_pages(self):
        response = self.client.get("/llms.txt")

        self.assertEqual(response.status_code, 200)
        self.assertIn("text/plain", response.headers["Content-Type"])
        body = response.data.decode()
        self.assertTrue(body.startswith("# Snapcraft\n"))
        self.assertIn("## Main pages", body)
        self.assertIn("https://snapcraft.io/about.md", body)
        self.assertIn("https://snapcraft.io/llms-full.txt", body)

    def test_the_sitemap_lists_the_same_pages(self):
        body = self.client.get("/sitemap-links.xml").data.decode()

        for path in store_llm.sitemap_paths(self.app):
            self.assertIn(f"<loc>https://snapcraft.io{path}</loc>", body)

    def test_suffix_serves_markdown(self):
        for path in ["/index.md", "/about.md", "/build.md", "/inkscape.md"]:
            response = self.client.get(path)

            self.assertEqual(response.status_code, 200, path)
            self.assertIn("text/markdown", response.content_type, path)

    def test_pages_behind_login_have_no_markdown_version(self):
        for path in ["/snaps.md", "/account/snaps.md", "/validation-sets.md"]:
            self.assertEqual(self.client.get(path).status_code, 404, path)

        self.assertNotEqual(self.client.get("/snaps").status_code, 404)

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
