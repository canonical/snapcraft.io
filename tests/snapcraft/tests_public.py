import responses
from flask_testing import TestCase
from cache.cache_utility import redis_cache
from webapp.app import create_app

# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class StorePage(TestCase):
    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"

        return app

    def setUp(self):
        redis_cache.fallback.clear()

    def mock_category(self, category, snaps=None, status=200):
        body = {
            "_embedded": {
                "clickindex:package": snaps
                or [
                    {
                        "package_name": f"{category}-snap-{i}",
                        "title": f"{category.title()} snap {i}",
                        "summary": f"Summary <b>{i}</b>",
                        "developer_name": "Dev",
                        "developer_validation": "verified",
                        "media": [],
                    }
                    for i in range(3)
                ]
            }
        }
        responses.add(
            responses.GET,
            "https://api.snapcraft.io/api/v1/snaps/search",
            json=body,
            status=status,
            match=[
                responses.matchers.query_param_matcher(
                    {"section": category}, strict_match=False
                )
            ],
        )

    @responses.activate
    def test_index(self):
        for category in ["featured", "development", "games", "server"]:
            self.mock_category(category)

        response = self.client.get("/")

        assert response.status_code == 200
        self.assert_template_used("index.html")

        html = response.get_data(as_text=True)
        for category in ["featured", "development", "games", "server"]:
            assert f"{category.title()} snap 2" in html
        assert "Summary &lt;b&gt;1&lt;/b&gt;" in html
        assert 'alt="Verified account"' in html
        assert html.count('data-js="featured-snap-card"') == 12
