import unittest

from webapp.app import create_app


class TestDsIcons(unittest.TestCase):
    def setUp(self):
        app = create_app(testing=True)
        self.client = app.test_client()

    def test_ds_icon_is_served(self):
        response = self.client.get("/icons/close.svg")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.location, None)
        self.assertIn("image/svg+xml", response.content_type)
        self.assertIn(b"<svg", response.data)

    def test_missing_ds_icon_returns_404(self):
        response = self.client.get("/icons/not-real.svg")

        self.assertEqual(response.status_code, 404)

    def test_static_ds_icon_is_served(self):
        response = self.client.get("/static/icons/close.svg")

        self.assertEqual(response.status_code, 200)
        self.assertIn("image/svg+xml", response.content_type)
        self.assertIn(b"<svg", response.data)

    def test_missing_static_ds_icon_returns_404(self):
        response = self.client.get("/static/icons/not-real.svg")

        self.assertEqual(response.status_code, 404)

    def test_non_svg_icon_path_returns_404(self):
        response = self.client.get("/icons/close.png")

        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
