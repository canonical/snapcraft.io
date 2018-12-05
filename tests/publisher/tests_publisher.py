from requests.exceptions import ConnectionError

import pymacaroons
import responses
from flask_testing import TestCase
from tests.publisher.endpoint_testing import BaseTestCases
from webapp.app import create_app
from webapp.authentication import get_authorization_header

# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class TestCache(BaseTestCases.EndpointLoggedInErrorHandling):
    def setUp(self):
        api_url = "https://dashboard.snapcraft.io/dev/api/account"
        endpoint_url = "/account/details"

        super().setUp(
            snap_name=None,
            endpoint_url=endpoint_url,
            method_endpoint="GET",
            api_url=api_url,
            method_api="GET",
        )

    @responses.activate
    def test_cache_disabled(self):
        responses.add(responses.GET, self.api_url, json={}, status=200)

        response = self.client.get(self.endpoint_url)
        self.assertEqual(200, response.status_code)

        responses.replace(responses.GET, self.api_url, body=ConnectionError())
        response = self.client.get(self.endpoint_url)
        self.assertEqual(response.status_code, 502)


class PublisherPage(TestCase):

    render_templates = False

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []

        return app

    def test_account(self):
        """
        Naive check that the basic redirects to the authentication system
        are working for the /account page
        """

        local_redirect = self.client.get("/account")
        redirect_url = "http://localhost/login?next=/account"
        assert local_redirect.status_code == 302
        assert local_redirect.headers.get("Location") == redirect_url

        ext_redirect = self.client.get("/login?next=/account")
        ext2_redirect = self.client.get("/login?next=/account")
        assert ext_redirect.status_code == 302
        assert ext2_redirect.status_code == 302
        assert "login.ubuntu.com" in ext_redirect.headers.get("Location")
        assert "login.ubuntu.com" in ext2_redirect.headers.get("Location")

    def _log_in(self, client):
        """Emulates test client login in the store.

        Fill current session with `openid`, `macaroon_root` and
        `macaroon_discharge`.

        Return the expected `Authorization` header for further verification in
        API requests.
        """
        # Basic root/discharge macaroons pair.
        root = pymacaroons.Macaroon("test", "testing", "a_key")
        root.add_third_party_caveat("3rd", "a_caveat-key", "a_ident")
        discharge = pymacaroons.Macaroon("3rd", "a_ident", "a_caveat_key")

        with client.session_transaction() as s:
            s["openid"] = {
                "image": None,
                "nickname": "Toto",
                "fullname": "El Toto",
            }
            s["macaroon_root"] = root.serialize()
            s["macaroon_discharge"] = discharge.serialize()

        return get_authorization_header(
            root.serialize(), discharge.serialize()
        )

    def test_username_not_logged_in(self):
        response = self.client.get("/account/username")
        self.assertEqual(302, response.status_code)
        self.assertEqual(
            "http://localhost/login?next=/account/username", response.location
        )

    def test_account_not_logged_in(self):
        response = self.client.get("/account")
        self.assertEqual(302, response.status_code)
        self.assertEqual(
            "http://localhost/login?next=/account", response.location
        )

    # /account endpoint
    # ===
    @responses.activate
    def test_account_redirect(self):
        self._log_in(self.client)
        response = self.client.get("/account")
        self.assertEqual(302, response.status_code)
        self.assertEqual("http://localhost/snaps", response.location)

    # /account/username endpoint
    # ===
    @responses.activate
    def test_username_logged_in(self):
        self._log_in(self.client)
        response = self.client.get("/account/username")

        assert response.status_code == 200
        self.assert_template_used("publisher/username.html")

    @responses.activate
    def test_post_username_logged_in(self):
        responses.add(
            responses.PATCH,
            "https://dashboard.snapcraft.io/dev/api/account",
            json={},
            status=204,
        )

        authorization = self._log_in(self.client)
        response = self.client.post(
            "/account/username", data={"username": "toto"}
        )

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            "https://dashboard.snapcraft.io/dev/api/account",
            called.request.url,
        )
        self.assertEqual(
            authorization, called.request.headers.get("Authorization")
        )
        self.assertEqual(called.response.json(), {})
        self.assertEqual(b'{"short_namespace": "toto"}', called.request.body)

        self.assertEqual(302, response.status_code)
        self.assertEqual("http://localhost/account/", response.location)

    @responses.activate
    def test_post_no_username_logged_in(self):
        self._log_in(self.client)
        response = self.client.post("/account/username")

        self.assertEqual(0, len(responses.calls))

        self.assertEqual(302, response.status_code)
        self.assertEqual(
            "http://localhost/account/username", response.location
        )

    @responses.activate
    def test_post_bad_username_logged_in(self):
        payload = {
            "error_list": [
                {"code": "custom-error", "message": "great message"}
            ]
        }
        responses.add(
            responses.PATCH,
            "https://dashboard.snapcraft.io/dev/api/account",
            json=payload,
            status=400,
        )

        authorization = self._log_in(self.client)
        response = self.client.post(
            "/account/username", data={"username": "toto"}
        )

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            "https://dashboard.snapcraft.io/dev/api/account",
            called.request.url,
        )
        self.assertEqual(
            authorization, called.request.headers.get("Authorization")
        )
        self.assertEqual(b'{"short_namespace": "toto"}', called.request.body)

        assert response.status_code == 200
        self.assert_template_used("publisher/username.html")
        self.assert_context("username", "toto")
        self.assert_context("error_list", payload["error_list"])
