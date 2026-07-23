from unittest import TestCase

from webapp.app import create_app
from webapp.config import VITE_PORT


class TestCSPHeaders(TestCase):
    def setUp(self):
        super().setUp()
        self.app = create_app(testing=True)
        self.app.add_url_rule("/test-csp", "test_csp", lambda: "OK")
        self.client = self.app.test_client()

    def test_development_csp_allows_vite_font_assets(self):
        response = self.client.get("/test-csp")

        content_security_policy = response.headers["Content-Security-Policy"]

        self.assertIn(
            f"font-src 'self' assets.ubuntu.com localhost:{VITE_PORT};",
            content_security_policy,
        )
