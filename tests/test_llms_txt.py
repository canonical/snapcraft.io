import re
import unittest
from unittest.mock import patch

from werkzeug.exceptions import MethodNotAllowed, NotFound
from werkzeug.routing.exceptions import RequestRedirect

from webapp.app import create_app
from webapp.site_pages import (
    EXCLUDED_PAGES,
    listed_paths,
    llms_sections,
    sitemap_pages,
)

CATEGORIES = [
    {"name": "games", "display_name": "Games"},
    {"name": "development", "display_name": "Development"},
]

NON_PAGE_SUFFIXES = (".json", ".xml", ".txt", ".ico", ".svg")


ROOT_CATCH_ALL = re.compile(r"/<[^>]+>")


def is_login_gated(view):
    while view is not None:
        code = getattr(view, "__code__", None)
        if code is not None and code.co_name == "is_user_logged_in":
            return True
        view = getattr(view, "__wrapped__", None)

    return False


def normalise(path):
    return path.rstrip("/") or "/"


def normalised_listed_paths():
    return {normalise(path) for path in listed_paths()}


class TestLlmsTxt(unittest.TestCase):
    def setUp(self):
        self.app = create_app(testing=True)
        self.client = self.app.test_client()

    def render(self):
        with patch(
            "webapp.snapcraft.views.get_store_categories",
            return_value=CATEGORIES,
        ):
            return self.client.get("/llms.txt")

    def test_llms_txt_is_served_as_plain_text(self):
        response = self.render()

        self.assertEqual(response.status_code, 200)
        self.assertIn("text/plain", response.headers["Content-Type"])

    def test_llms_txt_follows_the_spec_structure(self):
        body = self.render().data.decode()
        lines = [line for line in body.splitlines() if line.strip()]

        self.assertTrue(lines[0].startswith("# "), "must open with an H1")
        self.assertTrue(
            lines[1].startswith("> "), "H1 must be followed by a summary"
        )
        self.assertIn("## Main pages", body)
        self.assertIn("## Documentation", body)

        sections = [line for line in lines if line.startswith("## ")]

        self.assertEqual(
            sections[-1],
            "## Optional",
            "the Optional section must come last so agents can skip it",
        )

    def test_every_listed_page_matches_a_real_route(self):
        adapter = self.app.url_map.bind("snapcraft.io")
        unresolved = []

        for path in sorted(normalised_listed_paths()):
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

    def test_categories_are_listed_when_the_store_api_responds(self):
        titles = [s["section"] for s in llms_sections(CATEGORIES)]

        self.assertIn("Store categories", titles)

    def test_llms_txt_still_renders_when_the_store_api_fails(self):
        titles = [s["section"] for s in llms_sections([])]

        self.assertNotIn("Store categories", titles)

    def test_sitemap_pages_are_a_subset_of_the_listed_pages(self):
        paths = {normalise(path) for path in sitemap_pages()}

        self.assertTrue(paths)
        self.assertTrue(paths <= normalised_listed_paths())

    def test_category_pages_are_in_the_sitemap(self):
        paths = sitemap_pages(CATEGORIES)

        for category in CATEGORIES:
            self.assertIn(
                f"/store/categories/{category['name']}",
                paths,
            )

    def test_new_public_routes_are_listed_or_excluded(self):
        candidates = set()

        for rule in self.app.url_map.iter_rules():
            path = rule.rule

            if "<" in path or "GET" not in (rule.methods or set()):
                continue
            if path.startswith("/api/") or path.endswith(NON_PAGE_SUFFIXES):
                continue
            if is_login_gated(self.app.view_functions.get(rule.endpoint)):
                continue

            candidates.add(normalise(path))

        unclassified = sorted(
            candidates - normalised_listed_paths() - set(EXCLUDED_PAGES)
        )

        self.assertEqual(
            unclassified,
            [],
            f"public routes missing from llms.txt: {unclassified}",
        )
