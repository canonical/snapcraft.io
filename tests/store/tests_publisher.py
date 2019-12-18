import responses
from urllib.parse import urlencode
from flask_testing import TestCase
from webapp.app import create_app


class GetPublisherPageTest(TestCase):
    render_templates = False

    def setUp(self):
        self.publisher = "jetbrains"
        self.api_url = "".join(
            [
                "https://api.snapcraft.io/api/v1/",
                "snaps/search",
                "?",
                urlencode(
                    {
                        "q": "publisher:28zEonXNoBLvIB7xneRbltOsp0Nf7DwS",
                        "page": "1",
                        "size": "500",
                        "scope": "wide",
                        "arch": "wide",
                        "confinement": "strict,classic",
                        "fields": ",".join(
                            [
                                "package_name",
                                "title",
                                "summary",
                                "icon_url",
                                "media",
                                "publisher",
                                "developer_validation",
                                "origin",
                                "apps",
                            ]
                        ),
                    }
                ),
            ]
        )

        self.api_url

        self.endpoint_url = "/publisher/" + self.publisher

    def create_app(self):
        app = create_app(testing=True)
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

    @responses.activate
    def test_api_error(self):
        responses.add(responses.GET, self.api_url, json={}, status=504)

        response = self.client.get(self.endpoint_url)

        self.assertEqual(response.status_code, 200)
        self.assert_template_used("store/publisher-details.html")

    @responses.activate
    def test_no_snaps_from_api(self):
        payload = {"_embedded": {"clickindex:package": []}}

        responses.add(responses.GET, self.api_url, json=payload, status=200)

        response = self.client.get(self.endpoint_url)

        self.assertEqual(response.status_code, 200)
        self.assert_template_used("store/publisher-details.html")
