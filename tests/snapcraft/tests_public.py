from unittest.mock import patch

import responses
from flask_testing import TestCase
from webapp.app import create_app

# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class StorePage(TestCase):
    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"

        return app

    @responses.activate
    def test_index(self):
        with patch(
            "webapp.snapcraft.views.store_logic."
            "get_featured_snaps_by_category",
            return_value={},
        ):
            response = self.client.get("/")

        assert response.status_code == 200
        self.assert_template_used("index.html")


def _snap(name, validation="unproven", icon=True):
    return {
        "package_name": name,
        "title": name.title(),
        "developer_name": f"{name}-dev",
        "developer_validation": validation,
        "summary": f"Summary of {name}",
        "icon_url": f"https://example.com/{name}.png" if icon else "",
    }


class HomepageFeaturedSnaps(TestCase):
    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"

        return app

    def _get(self, featured):
        with patch(
            "webapp.snapcraft.views.store_logic."
            "get_featured_snaps_by_category",
            return_value=featured,
        ) as mock_get:
            response = self.client.get("/")
        return response, mock_get

    def test_renders_all_categories_server_side(self):
        featured = {
            "featured": [_snap("alpha", "verified"), _snap("beta", "starred")],
            "development": [_snap("gamma", icon=False)],
            "games": [_snap("delta")],
            "server": [_snap("epsilon")],
        }
        response, mock_get = self._get(featured)
        html = response.get_data(as_text=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            mock_get.call_args[0][1],
            ["Featured", "Development", "Games", "Server"],
        )
        for name in ["alpha", "beta", "gamma", "delta", "epsilon"]:
            self.assertIn(f'href="/{name}"', html)
        self.assertIn("Summary of alpha", html)
        self.assertIn("alpha-dev", html)
        self.assertIn("Verified account", html)
        self.assertIn("Star developer", html)
        self.assertIn("https://example.com/alpha.png", html)

    def test_view_all_links_and_hidden_panels(self):
        categories = ["featured", "development", "games", "server"]
        featured = {c: [_snap(c)] for c in categories}
        response, _ = self._get(featured)
        html = response.get_data(as_text=True)

        for category in featured:
            self.assertIn(
                f'<a href="/search?categories={category}">'
                f"View all {category} snaps</a>",
                html,
            )
        self.assertEqual(html.count('data-js="featured-category-panel"'), 4)
        self.assertEqual(html.count("hidden>"), 3)

    def test_switch_data_category_is_lowercase(self):
        featured = {c: [_snap(c)] for c in ["featured", "development"]}
        response, _ = self._get(featured)
        html = response.get_data(as_text=True)

        self.assertIn('data-category="featured"', html)
        self.assertIn('data-category="development"', html)
        self.assertNotIn('data-category="Featured"', html)
        self.assertNotIn('data-category="Development"', html)

    def test_empty_category_still_renders(self):
        featured = {
            "featured": [],
            "development": [],
            "games": [],
            "server": [],
        }
        response, _ = self._get(featured)

        self.assertEqual(response.status_code, 200)
        self.assertIn("View all featured snaps", response.get_data(True))
