import responses
from flask_testing import TestCase
from webapp.app import app

# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class StorePage(TestCase):

    render_templates = False

    def create_app(self):
        app.config["TESTING"] = True
        app.secret_key = "secret_key"

        return app

    @responses.activate
    def test_index(self):
        response = self.client.get("/")

        assert response.status_code == 200
        self.assert_template_used("index.html")
