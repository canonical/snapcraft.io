from flask_testing import TestCase
from webapp.app import create_app


class FirstSnap(TestCase):
    render_templates = False

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"

        return app

    def test_get_os(self):
        response = self.client.get("/first-snap/python")
        assert response.status_code == 200
        self.assert_context("language", "python")

    def test_get_build(self):
        response = self.client.get("/first-snap/python/linux-auto/build")
        assert response.status_code == 200
        self.assert_context("language", "python")
        self.assert_context("os", "linux-auto")

    def test_get_package(self):
        response = self.client.get("/first-snap/python/linux-auto/package")
        assert response.status_code == 200
        self.assert_context("language", "python")
        self.assert_context("os", "linux-auto")

    def test_get_test(self):
        response = self.client.get("/first-snap/python/macos-auto/test")
        assert response.status_code == 200
        self.assert_context("language", "python")
        self.assert_context("os", "macos-auto")

    def test_get_push(self):
        response = self.client.get("/first-snap/python/linux/push")

        assert response.status_code == 200
        assert response.data == b"pythonlinuxpush"
