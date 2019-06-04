from flask_testing import TestCase

from webapp.app import create_app


class Builder(TestCase):
    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"

        return app

    def test_hompage(self):
        response = self.client.get("/build")
        self.assert200(response)
