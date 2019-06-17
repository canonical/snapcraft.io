from flask_testing import TestCase

from webapp.app import create_app


class BuilderHomepage(TestCase):
    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        return app

    def test_renders(self):
        response = self.client.get("/build")
        self.assert200(response)
