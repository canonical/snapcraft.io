import responses
from flask_testing import TestCase
from webapp.app import create_app


class GetDetailsPageTest(TestCase):
    render_templates = False

    def setUp(self):
        self.snap_name = "toto"
        self.api_url = "".join(
            [
                "https://api.snapcraft.io/v2/",
                "snaps/info/",
                self.snap_name,
                "?fields=title,summary,description,license,contact,website,",
                "publisher,prices,media,download,version,created-at,"
                "confinement",
            ]
        )
        self.endpoint_url = "/" + self.snap_name

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []

        return app

    @responses.activate
    def test_api_500(self):
        payload = {"error-list": []}
        responses.add(
            responses.Response(
                method="GET", url=self.api_url, json=payload, status=500
            )
        )

        response = self.client.get(self.endpoint_url)

        assert len(responses.calls) == 1
        called = responses.calls[0]
        assert called.request.url == self.api_url

        assert response.status_code == 502

    @responses.activate
    def test_api_500_no_answer(self):
        responses.add(
            responses.Response(method="GET", url=self.api_url, status=500)
        )

        response = self.client.get(self.endpoint_url)

        assert len(responses.calls) == 1
        called = responses.calls[0]
        assert called.request.url == self.api_url

        assert response.status_code == 502
