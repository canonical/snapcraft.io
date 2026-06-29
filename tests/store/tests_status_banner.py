import responses
from unittest.mock import patch
from flask import render_template
from flask_testing import TestCase
from webapp.app import create_app

SNAP_FIND_RESPONSE = {
    "results": [
        {
            "name": "test-snap",
            "snap": {
                "media": [],
                "publisher": {
                    "display-name": "Test Publisher",
                    "id": "test-publisher-id",
                    "username": "test-publisher",
                    "validation": "unproven",
                },
                "summary": "A test snap",
                "title": "Test Snap",
            },
            "snap-id": "test-snap-id",
        }
    ]
}


class StatusBannerTest(TestCase):
    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []
        return app

    @responses.activate
    def test_banner_shown_when_status_banner_set(self):
        message = "Temporary performance degradation in progress."
        with patch("webapp.handlers.STATUS_BANNER", message):
            responses.add(
                responses.GET,
                "https://api.snapcraft.io/v2/snaps/find",
                json=SNAP_FIND_RESPONSE,
                status=200,
            )
            response = self.client.get("/publisher/test-publisher")
        self.assertEqual(response.status_code, 200)
        body = response.get_data(as_text=True)
        self.assertIn("p-notification--caution", body)
        self.assertIn(message, body)

    @responses.activate
    def test_banner_hidden_when_status_banner_empty(self):
        with patch("webapp.handlers.STATUS_BANNER", ""):
            responses.add(
                responses.GET,
                "https://api.snapcraft.io/v2/snaps/find",
                json=SNAP_FIND_RESPONSE,
                status=200,
            )
            response = self.client.get("/publisher/test-publisher")
        self.assertEqual(response.status_code, 200)
        body = response.get_data(as_text=True)
        self.assertNotIn('id="status-banner"', body)

    def test_banner_shown_in_admin_layout(self):
        message = "Admin maintenance notice."
        with patch("webapp.handlers.STATUS_BANNER", message):
            with self.app.test_request_context("/admin"):
                body = render_template(
                    "admin/admin.html",
                    api_url="https://dashboard.snapcraft.io/",
                )
        self.assertIn('id="status-banner"', body)
        self.assertIn(message, body)
        self.assertIn("z-index: 201;", body)
