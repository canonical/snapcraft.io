import requests

import responses
from flask_testing import TestCase
from pybreaker import CircuitBreakerError
from pymacaroons import Macaroon
from webapp.app import create_app


class LoginHandlerTest(TestCase):
    render_templates = False

    def setUp(self):
        self.api_url = "https://dashboard.snapcraft.io/dev/api/acl/"
        self.endpoint_url = "/login"

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []

        return app

    def test_redirect_user_logged_in(self):
        with self.client.session_transaction() as s:
            s["openid"] = "openid"
            s["macaroon_root"] = "macaroon_root"
            s["macaroon_discharge"] = "macaroon_discharge"

        response = self.client.get(self.endpoint_url)
        assert response.status_code == 302
        self.assertEqual("http://localhost/", response.location)

    def test_redirect_user_logged_in_next_url(self):
        with self.client.session_transaction() as s:
            s["openid"] = "openid"
            s["macaroon_root"] = "macaroon_root"
            s["macaroon_discharge"] = "macaroon_discharge"

        response = self.client.get(self.endpoint_url + "?next=/test")
        assert response.status_code == 302
        self.assertEqual("http://localhost/test", response.location)

    @responses.activate
    def test_login_handler_redirect(self):
        m = Macaroon()
        m.add_third_party_caveat("login.ubuntu.com", "key", "id")

        serialized_macaroon = m.serialize()

        responses.add(
            responses.Response(
                method="POST",
                url=self.api_url,
                json={"macaroon": serialized_macaroon},
                status=200,
            )
        )

        response = self.client.get(self.endpoint_url)

        assert len(responses.calls) == 1
        assert response.status_code == 302

    @responses.activate
    def test_login_api_500(self):
        responses.add(
            responses.Response(method="POST", url=self.api_url, status=500)
        )

        response = self.client.get(self.endpoint_url)

        assert len(responses.calls) == 1
        assert response.status_code == 502

    @responses.activate
    def test_login_api_401(self):
        responses.add(
            responses.Response(method="POST", url=self.api_url, status=401)
        )

        response = self.client.get(self.endpoint_url)

        assert len(responses.calls) == 1
        assert response.status_code == 302
        self.assertEqual("http://localhost/logout", response.location)

    @responses.activate
    def test_login_connection_error(self):
        responses.add(
            responses.Response(
                method="POST",
                url=self.api_url,
                body=requests.exceptions.ConnectionError(),
                status=500,
            )
        )

        response = self.client.get(self.endpoint_url)

        assert response.status_code == 502

    @responses.activate
    def test_login_circuit_breaker(self):
        responses.add(
            responses.Response(
                method="POST",
                url=self.api_url,
                body=CircuitBreakerError(),
                status=500,
            )
        )

        response = self.client.get(self.endpoint_url)

        assert response.status_code == 503
