from flask_testing import TestCase
from webapp.app import app


class GetPublisherPageTest(TestCase):
    render_templates = False

    def create_app(self):
        app.config["TESTING"] = True
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []

        return app

    def test_non_existant_publisher(self):
        response = self.client.get("/publisher/toto")
        self.assertEqual(response.status_code, 404)

    def test_existant_publisher(self):
        response = self.client.get("/publisher/jetbrains")
        self.assertEqual(response.status_code, 200)
        self.assert_template_used("store/publisher-details.html")
