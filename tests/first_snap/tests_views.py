from flask_testing import TestCase
from webapp.app import create_app
from unittest.mock import patch, mock_open
import os

import webapp.first_snap.views as views


class FirstSnap(TestCase):
    render_templates = False

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"

        return app

    @patch("builtins.open", new_callable=mock_open, read_data="test: test")
    def test_get_file(self, mock_open_file):
        yaml_read = views.get_file("filename.yaml")
        self.assertEqual(yaml_read, {"test": "test"})
        mock_open_file.assert_called_with(
            os.path.join(self.app.root_path, "filename.yaml"), "r"
        )

    @patch(
        "builtins.open", new_callable=mock_open, read_data="test: test: test"
    )
    def test_get_file_error(self, mock_open_file):
        yaml_read = views.get_file("filename.yaml")
        self.assertEqual(yaml_read, None)
        mock_open_file.assert_called_with(
            os.path.join(self.app.root_path, "filename.yaml"), "r"
        )

    def test_get_language(self):
        response = self.client.get("/first-snap/python")
        assert response.status_code == 200
        self.assert_context("language", "python")
        self.assert_template_used("first-snap/install-snapcraft.html")

    def test_get_package(self):
        response = self.client.get("/first-snap/python/linux-auto/package")
        assert response.status_code == 200
        self.assert_context("language", "python")
        self.assert_context("os", "linux-auto")
        self.assert_template_used("first-snap/package.html")

    def test_get_build(self):
        response = self.client.get("/first-snap/python/linux-auto/build")
        assert response.status_code == 200
        self.assert_context("language", "python")
        self.assert_context("os", "linux-auto")
        self.assert_template_used("first-snap/build.html")

    def test_get_test(self):
        response = self.client.get("/first-snap/python/macos-auto/test")
        assert response.status_code == 200
        self.assert_context("language", "python")
        self.assert_context("os", "macos-auto")
        self.assert_template_used("first-snap/test.html")

    def test_get_push(self):
        response = self.client.get("/first-snap/python/linux/push")
        self.assert_template_used("first-snap/push.html")

        assert response.status_code == 200
        assert response.data == b"pythonlinuxpush"
