import re
import unittest

from werkzeug.exceptions import MethodNotAllowed, NotFound
from werkzeug.routing.exceptions import RequestRedirect

from webapp.app import create_app
from webapp.site_pages import (
    discover_pages,
    is_login_gated,
    llms_sections,
    render_llms_txt,
    sitemap_paths,
)

CATEGORIES = [
    {"name": "games", "display_name": "Games"},
    {"name": "development", "display_name": "Development"},
]

ROOT_CATCH_ALL = re.compile(r"/<[^>]+>")


class TestSitePages(unittest.TestCase):
    def setUp(self):
        self.app = create_app(testing=True)
        self.pages = discover_pages(self.app)
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
        for path in self.paths:
            self.assertNotIn("<", path)

        self.assertNotIn("/snaps", self.paths)
        self.assertNotIn("/validation-sets", self.paths)

    def test_login_gated_pages_are_left_out(self):
        gated = self.app.view_functions["publisher_snaps.get_account_snaps"]
        public = self.app.view_functions["snapcraft.about"]

        self.assertTrue(is_login_gated(gated))
        self.assertFalse(is_login_gated(public))

    def test_the_homepage_is_the_file_header_not_a_link(self):
        self.assertNotIn("/", self.paths)

    def test_noindex_pages_are_left_out(self):
        self.assertNotIn("/about/thank-you", self.paths)

    def test_redirects_and_machine_formats_are_left_out(self):
        self.assertNotIn("/community", self.paths)
        self.assertNotIn("/create", self.paths)
        self.assertNotIn("/account.json", self.paths)
        self.assertNotIn("/sitemap.xml", self.paths)
        self.assertNotIn("/_status/check", self.paths)

    def test_routes_rendering_the_same_page_are_listed_once(self):
        self.assertIn("/store", self.paths)
        self.assertNotIn("/explore", self.paths)

    def test_pages_sharing_a_title_are_listed_once(self):
        self.assertIn("/store", self.paths)
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
        sections = [group["section"] for group in llms_sections(self.pages)]

        self.assertIn("Main pages", sections)
        self.assertIn("Publishing a snap", sections)
        self.assertNotIn("Other pages", sections)

    def test_optional_comes_last_so_agents_can_skip_it(self):
        body = render_llms_txt(self.app)
        headings = [
            line for line in body.splitlines() if line.startswith("## ")
        ]

        self.assertEqual(headings[-1], "## Optional")

    def test_llms_txt_follows_the_spec_structure(self):
        lines = [
            line
            for line in render_llms_txt(self.app).splitlines()
            if line.strip()
        ]

        self.assertTrue(lines[0].startswith("# "), "must open with an H1")
        self.assertTrue(
            lines[1].startswith("> "), "H1 must be followed by a summary"
        )

    def test_pages_are_linked_as_markdown(self):
        body = render_llms_txt(self.app)

        self.assertIn("https://snapcraft.io/about/publish.md", body)

    def test_the_sitemap_lists_the_same_pages(self):
        paths = sitemap_paths(self.app, CATEGORIES)

        self.assertLessEqual(self.paths, set(paths))

        for category in CATEGORIES:
            self.assertIn(
                f"/store/categories/{category['name']}",
                paths,
            )


class TestLlmsTxtRoute(unittest.TestCase):
    def setUp(self):
        self.app = create_app(testing=True)
        self.client = self.app.test_client()

    def render(self):
        return self.client.get("/llms.txt")

    def test_llms_txt_is_served_as_plain_text(self):
        response = self.render()

        self.assertEqual(response.status_code, 200)
        self.assertIn("text/plain", response.headers["Content-Type"])

    def test_llms_txt_lists_the_pages(self):
        body = self.render().data.decode()

        self.assertIn("## Main pages", body)
        self.assertIn("https://snapcraft.io/about.md", body)
