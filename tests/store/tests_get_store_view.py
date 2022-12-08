import responses
from urllib.parse import urlencode
from flask_testing import TestCase
from webapp.app import create_app


class GetStoreViewTest(TestCase):
    render_templates = False

    def setUp(self):
        self.categories_api_url = (
            "https://api.snapcraft.io/v2/snaps/categories?type=shared"
        )
        self.featured_snaps_api_url = "".join(
            [
                "https://api.snapcraft.io/api/v1/",
                "snaps/search",
                "?",
                urlencode(
                    {
                        "q": "",
                        "size": "10",
                        "page": "1",
                        "scope": "wide",
                        "confinement": "strict,classic",
                        "fields": "package_name,title,summary,"
                        "architecture,media,developer_name,"
                        "developer_id,developer_validation,origin,"
                        "apps,sections",
                        "arch": "wide",
                        "section": "featured",
                    }
                ),
            ]
        )
        self.endpoint_url = "/store"

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []

        return app

    @responses.activate
    def test_get_store_view(self):
        payload_categories = {}
        payload_featured_snaps = {
            "results": [
                {
                    "media": [{"type": "icon", "url": "test.png"}],
                    "package_name": "featured_test",
                }
            ],
            "total": 1,
        }

        responses.add(
            responses.Response(
                method="GET",
                url=self.categories_api_url,
                json=payload_categories,
                status=200,
            )
        )

        responses.add(
            responses.Response(
                method="GET",
                url=self.featured_snaps_api_url,
                json=payload_featured_snaps,
                status=200,
            )
        )

        response = self.client.get(self.endpoint_url)

        self.assertEqual(len(responses.calls), 2)
        self.assertEqual(response.status_code, 200)

        self.assert_template_used("store/store.html")

    @responses.activate
    def test_get_store_view_with_featured(self):
        payload_categories = {}
        payload_featured_snaps = {
            "results": [
                {
                    "media": [{"type": "icon", "url": "test.png"}],
                    "package_name": "featured_test",
                }
            ],
            "total": 1,
        }

        responses.add(
            responses.Response(
                method="GET",
                url=self.categories_api_url,
                json=payload_categories,
                status=200,
            )
        )

        responses.add(
            responses.Response(
                method="GET",
                url=self.featured_snaps_api_url,
                json=payload_featured_snaps,
                status=200,
            )
        )

        response = self.client.get(self.endpoint_url)

        self.assertEqual(len(responses.calls), 2)
        self.assertEqual(response.status_code, 200)

        self.assert_template_used("store/store.html")

    @responses.activate
    def test_get_store_view_fail_categories(self):
        payload_categories = {}
        payload_featured_snaps = {
            "results": [
                {
                    "media": [{"type": "icon", "url": "test.png"}],
                    "package_name": "featured_test",
                }
            ],
            "total": 1,
        }

        responses.add(
            responses.Response(
                method="GET",
                url=self.categories_api_url,
                json=payload_categories,
                status=500,
            )
        )

        responses.add(
            responses.Response(
                method="GET",
                url=self.featured_snaps_api_url,
                json=payload_featured_snaps,
                status=200,
            )
        )

        response = self.client.get(self.endpoint_url)

        self.assertEqual(len(responses.calls), 2)
        self.assertEqual(response.status_code, 200)

        self.assert_template_used("store/store.html")

    @responses.activate
    def test_get_store_view_fail_featured_snaps(self):
        payload_categories = {}
        payload_featured_snaps = {}

        responses.add(
            responses.Response(
                method="GET",
                url=self.categories_api_url,
                json=payload_categories,
                status=200,
            )
        )

        responses.add(
            responses.Response(
                method="GET",
                url=self.featured_snaps_api_url,
                json=payload_featured_snaps,
                status=500,
            )
        )

        response = self.client.get(self.endpoint_url)

        self.assertEqual(len(responses.calls), 2)
        self.assertEqual(response.status_code, 502)

        self.assert_template_used("50X.html")
