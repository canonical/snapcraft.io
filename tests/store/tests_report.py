import responses
from flask_testing import TestCase

from webapp.app import create_app


class ReportSnapTest(TestCase):
    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []
        app.config["REPORT_SHEET_URL"] = "https://example.com/report"
        app.config["TURNSTILE_VERIFY_URL"] = "https://example.com/turnstile"
        app.config["TURNSTILE_SECRET_KEY"] = ""
        return app

    @responses.activate
    def test_report_without_turnstile_secret(self):
        responses.add(
            responses.Response(
                method="POST",
                url=self.app.config["REPORT_SHEET_URL"],
                status=200,
            )
        )

        response = self.client.post(
            "/report",
            data={
                "snap_name": "test-snap",
                "reason": "Snap Store terms of service violation",
                "comment": "A test report",
            },
        )

        assert response.status_code == 200
        assert response.get_json() == {"ok": True}
        assert len(responses.calls) == 1
        assert (
            responses.calls[0].request.url
            == self.app.config["REPORT_SHEET_URL"]
        )

    def test_report_rejects_missing_turnstile_token(self):
        self.app.config["TURNSTILE_SECRET_KEY"] = "test-secret"

        response = self.client.post(
            "/report",
            data={
                "snap_name": "test-snap",
                "reason": "Snap Store terms of service violation",
                "comment": "A test report",
            },
        )

        assert response.status_code == 400
        assert response.get_json() == {"error": "turnstile_failed"}

    @responses.activate
    def test_report_rejects_invalid_turnstile_token(self):
        self.app.config["TURNSTILE_SECRET_KEY"] = "test-secret"
        responses.add(
            responses.Response(
                method="POST",
                url=self.app.config["TURNSTILE_VERIFY_URL"],
                json={
                    "success": False,
                    "error-codes": ["invalid-input-response"],
                },
                status=200,
            )
        )

        response = self.client.post(
            "/report",
            data={
                "snap_name": "test-snap",
                "reason": "Snap Store terms of service violation",
                "comment": "A test report",
                "cf-turnstile-response": "invalid-token",
            },
        )

        assert response.status_code == 400
        assert response.get_json() == {"error": "turnstile_failed"}
        assert len(responses.calls) == 1
        assert (
            responses.calls[0].request.url
            == self.app.config["TURNSTILE_VERIFY_URL"]
        )

    @responses.activate
    def test_report_submits_when_turnstile_token_is_valid(self):
        self.app.config["TURNSTILE_SECRET_KEY"] = "test-secret"
        responses.add(
            responses.Response(
                method="POST",
                url=self.app.config["TURNSTILE_VERIFY_URL"],
                json={"success": True},
                status=200,
            )
        )
        responses.add(
            responses.Response(
                method="POST",
                url=self.app.config["REPORT_SHEET_URL"],
                status=200,
            )
        )

        response = self.client.post(
            "/report",
            data={
                "snap_name": "test-snap",
                "reason": "Snap Store terms of service violation",
                "comment": "A test report",
                "cf-turnstile-response": "valid-token",
            },
        )

        assert response.status_code == 200
        assert response.get_json() == {"ok": True}
        assert len(responses.calls) == 2
        assert (
            responses.calls[0].request.url
            == self.app.config["TURNSTILE_VERIFY_URL"]
        )
        assert (
            responses.calls[1].request.url
            == self.app.config["REPORT_SHEET_URL"]
        )
