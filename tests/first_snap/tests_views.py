import os

from unittest.mock import mock_open, patch
from flask_testing import TestCase

from webapp import helpers
from webapp.app import create_app


class FirstSnap(TestCase):
    render_templates = False

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"

        return app

    @patch("builtins.open", new_callable=mock_open, read_data="test: test")
    def test_get_yaml(self, mock_open_file):
        yaml_read = helpers.get_yaml("filename.yaml", typ="rt")
        self.assertEqual(yaml_read, {"test": "test"})
        mock_open_file.assert_called_with(
            os.path.join(self.app.root_path, "filename.yaml"), "r"
        )

    @patch(
        "builtins.open", new_callable=mock_open, read_data="test: test: test"
    )
    def test_get_yaml_error(self, mock_open_file):
        yaml_read = helpers.get_yaml("filename.yaml", typ="rt")
        self.assertEqual(yaml_read, None)
        mock_open_file.assert_called_with(
            os.path.join(self.app.root_path, "filename.yaml"), "r"
        )

    def test_get_language(self):
        response = self.client.get("/first-snap/python")
        assert response.status_code == 200
        self.assert_context("language", "python")
        self.assert_template_used("first-snap/install-snapcraft.html")

    def test_get_language_404(self):
        response = self.client.get("/first-snap/toto-lang")

        assert response.status_code == 404

    def test_get_package(self):
        response = self.client.get("/first-snap/python/linux-auto/package")
        assert response.status_code == 200
        self.assert_context("language", "python")
        self.assert_context("os", "linux-auto")
        self.assert_context("has_user_chosen_name", False)
        self.assert_template_used("first-snap/package.html")

    def test_get_package_snap_name(self):
        response = self.client.get(
            "/first-snap/python/linux-auto/package",
            headers={"Cookie": "fsf_snap_name_python=test-snap-name-python"},
        )
        assert response.status_code == 200
        self.assert_context("language", "python")
        self.assert_context("snap_name", "test-snap-name-python")
        self.assert_context("has_user_chosen_name", True)
        self.assert_template_used("first-snap/package.html")

    def test_get_package_404_language(self):
        response = self.client.get("/first-snap/toto-lang/linux/package")

        assert response.status_code == 404

    @patch("builtins.open", new_callable=mock_open, read_data="name: test")
    def test_get_snapcraft_yaml(self, mock_open_file):
        response = self.client.get("/first-snap/python/snapcraft.yaml")
        self.assert200(response)
        self.assertEqual(response.get_data(as_text=True), "name: test")

    def test_get_snapcraft_yaml_404(self):
        response = self.client.get("/first-snap/toto-lang/snapcraft.yaml")
        self.assert404(response)

    def test_get_build(self):
        response = self.client.get("/first-snap/python/linux-auto/build")
        assert response.status_code == 200
        self.assert_context("language", "python")
        self.assert_context("os", "linux-auto")
        self.assert_template_used("first-snap/build.html")

    def test_get_build_snap_name(self):
        response = self.client.get(
            "/first-snap/python/linux-auto/build",
            headers={"Cookie": "fsf_snap_name_python=test-snap-name-python"},
        )
        assert response.status_code == 200
        self.assert_context("language", "python")
        self.assert_context("os", "linux-auto")
        self.assert_context("snap_name", "test-snap-name-python")
        self.assert_template_used("first-snap/build.html")

    def test_get_build_404_language(self):
        response = self.client.get("/first-snap/toto-lang/linux/build")

        assert response.status_code == 404

    def test_get_build_404_os(self):
        response = self.client.get("/first-snap/python/totOs/build")

        assert response.status_code == 404

    def test_get_test(self):
        response = self.client.get("/first-snap/python/macos-auto/test")
        assert response.status_code == 200
        self.assert_context("language", "python")
        self.assert_context("os", "macos-auto")
        self.assert_template_used("first-snap/test.html")

    def test_get_test_snap_name(self):
        response = self.client.get(
            "/first-snap/python/macos-auto/test",
            headers={"Cookie": "fsf_snap_name_python=test-snap-name-python"},
        )
        assert response.status_code == 200
        self.assert_context("language", "python")
        self.assert_context("os", "macos-auto")
        self.assert_context("snap_name", "test-snap-name-python")
        self.assert_template_used("first-snap/test.html")

    def test_get_test_404_language(self):
        response = self.client.get("/first-snap/toto-lang/linux/test")

        assert response.status_code == 404

    def test_get_test_404_os(self):
        response = self.client.get("/first-snap/python/totOs/test")

        assert response.status_code == 404

    def test_get_push(self):
        response = self.client.get("/first-snap/python/linux/push")

        assert response.status_code == 200
        self.assert_template_used("first-snap/push.html")
        self.assert_context("language", "python")
        self.assert_context("os", "linux")
        self.assert_context("user", None)
        self.assert_context("snap_name", "test-offlineimap-{name}")

    def test_get_push_snap_name(self):
        response = self.client.get(
            "/first-snap/python/linux/push",
            headers={"Cookie": "fsf_snap_name_python=test-snap-name-python"},
        )
        assert response.status_code == 200
        self.assert_context("language", "python")
        self.assert_context("os", "linux")
        self.assert_context("snap_name", "test-snap-name-python")
        self.assert_context("has_user_chosen_name", True)
        self.assert_context("user", None)
        self.assert_template_used("first-snap/push.html")

    def test_get_push_logged_in(self):
        user_expected = {
            "image": None,
            "username": "Toto",
            "display_name": "El Toto",
            "email": "testing@testing.com",
        }
        with self.client.session_transaction() as s:
            s["openid"] = {
                "image": None,
                "nickname": "Toto",
                "fullname": "El Toto",
                "email": "testing@testing.com",
            }
        response = self.client.get("/first-snap/python/linux/push")

        assert response.status_code == 200
        self.assert_template_used("first-snap/push.html")
        self.assert_context("language", "python")
        self.assert_context("os", "linux")
        self.assert_context("user", user_expected)
        self.assert_context("snap_name", "test-offlineimap-{name}")

    def test_get_push_404(self):
        response = self.client.get("/first-snap/toto-lang/linux/push")

        assert response.status_code == 404
