from urllib.parse import parse_qs, urlparse

from flask_testing import TestCase

from webapp.app import create_app


class StoreRedirectsTest(TestCase):
    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []

        return app

    def test_store_redirects_to_search_when_q_present(self):
        response = self.client.get("/store?q=vlc", follow_redirects=False)

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.location, "/search?q=vlc")

    def test_store_redirects_to_search_when_q_is_empty(self):
        response = self.client.get("/store?q=", follow_redirects=False)

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.location, "/search?q=")

    def test_store_redirects_when_allowlisted_params_present(self):
        response = self.client.get(
            "/store?categories=featured&page=2&architecture=amd64",
            follow_redirects=False,
        )

        self.assertEqual(response.status_code, 302)
        parsed = urlparse(response.location)
        self.assertEqual(parsed.path, "/search")
        self.assertEqual(
            parse_qs(parsed.query, keep_blank_values=True),
            {
                "categories": ["featured"],
                "page": ["2"],
                "architecture": ["amd64"],
            },
        )

    def test_store_redirects_with_allowlisted_params_and_ignores_others(self):
        response = self.client.get(
            "/store?q=test%20query&categories=desktop&page=3"
            "&architecture=arm64&foo=1",
            follow_redirects=False,
        )

        self.assertEqual(response.status_code, 302)
        parsed = urlparse(response.location)
        self.assertEqual(parsed.path, "/search")
        self.assertEqual(
            parse_qs(parsed.query, keep_blank_values=True),
            {
                "q": ["test query"],
                "categories": ["desktop"],
                "page": ["3"],
                "architecture": ["arm64"],
            },
        )

    def test_store_does_not_redirect_when_q_is_absent(self):
        response = self.client.get("/store?foo=1", follow_redirects=False)

        self.assertEqual(response.status_code, 200)
