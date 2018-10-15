from flask_testing import TestCase
from webapp.app import create_app


class FirstSnap(TestCase):
    render_templates = False

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"

        return app

    def test_index(self):
        response = self.client.get("/first-snap")
        assert response.status_code == 200
        assert response.data == b"first snap"

    def test_get_language(self):
        response = self.client.get("/first-snap/python")
        assert response.status_code == 200
        assert response.data == b"python"

    def test_get_os(self):
        response = self.client.get("/first-snap/python/linux")
        assert response.status_code == 200
        assert response.data == b"pythonlinux"

    def test_get_test(self):
        response = self.client.get("/first-snap/python/linux/test")
        assert response.status_code == 200
        assert response.data == b"pythonlinuxtest"

    def test_get_build(self):
        response = self.client.get("/first-snap/python/linux/build")
        assert response.status_code == 200
        assert response.data == b"pythonlinuxbuild"

    def test_get_package(self):
        response = self.client.get("/first-snap/python/linux/package")
        assert response.status_code == 200
        assert response.data == b"pythonlinuxpackage"

    def test_get_push(self):
        response = self.client.get("/first-snap/python/linux/push")
        assert response.status_code == 200
        assert response.data == b"pythonlinuxpush"
