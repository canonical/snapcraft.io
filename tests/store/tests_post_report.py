import requests

import responses
from flask_testing import TestCase
from webapp.api import google
from webapp.app import create_app


class PostReportTest(TestCase):
    render_templates = False

    def setUp(self):
        self.snap_name = "toto"
        self.api_url = "https://url.to.spreadsheet/"
        self.endpoint_url = "/" + self.snap_name + "/report"

    def create_app(self):
        google.SPREADSHEET_REPORT_SNAP = "https://url.to.spreadsheet/"

        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []

        return app

    def _check_calls(self):
        assert len(responses.calls) == 1
        called = responses.calls[0]
        assert called.request.url == self.api_url

    def test_no_spreadsheet_url(self):
        google.SPREADSHEET_REPORT_SNAP = ""
        response = self.client.post(self.endpoint_url)

        assert len(responses.calls) == 0
        assert response.status_code == 200
        assert response.json == {"success": False}

    @responses.activate
    def test_api_500(self):
        responses.add(
            responses.Response(method="POST", url=self.api_url, status=500)
        )

        response = self.client.post(self.endpoint_url)
        self._check_calls()

        assert response.status_code == 200
        assert response.json == {"success": False}

    @responses.activate
    def test_api_no_connexion(self):
        responses.add(
            responses.Response(
                method="POST",
                url=self.api_url,
                status=500,
                body=requests.exceptions.ConnectionError(),
            )
        )

        response = self.client.post(self.endpoint_url)
        self._check_calls()

        assert response.status_code == 200
        assert response.json == {"success": False}

    @responses.activate
    def test_api_error_decode(self):
        # To test this I return no json from the server, this makes the
        # call to the function response.json() raise a ValueError exception
        responses.add(
            responses.Response(method="POST", url=self.api_url, status=200)
        )

        response = self.client.post(self.endpoint_url)
        self._check_calls()

        assert response.status_code == 200
        assert response.json == {"success": False}

    @responses.activate
    def test_report_success(self):
        responses.add(
            responses.Response(
                method="POST", url=self.api_url, json={}, status=200
            )
        )

        response = self.client.post(
            self.endpoint_url,
            data={
                "snap": self.snap_name,
                "reason": "this snap is great",
                "comment": "to cool to be true",
                "email": "cool@email.com",
            },
        )
        self._check_calls()

        called = responses.calls[0]
        self.assertIn("snap=toto", called.request.body)
        self.assertIn("reason=this+snap+is+great", called.request.body)
        self.assertIn("comment=to+cool+to+be+true", called.request.body)
        self.assertIn("email=cool%40email.com", called.request.body)

        assert response.status_code == 200
        assert response.json == {"success": True}
