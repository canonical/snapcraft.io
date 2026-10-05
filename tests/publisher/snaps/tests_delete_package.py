import responses
from flask_testing import TestCase
from pymacaroons import Macaroon

from webapp.app import create_app
from webapp.authentication import SCA_DISCHARGE_COOKIE, SCA_ROOT_COOKIE

PUBLISHERGW_URL = "https://api.charmhub.io/v1/snap/test-snap"


class DeletePackageTest(TestCase):
    def setUp(self):
        self.snap_name = "test-snap"
        self.endpoint_url = f"/packages/{self.snap_name}"

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []

        return app

    def _log_in(self, with_sca_cookies=True):
        root = Macaroon(location="store", identifier="root", key="root-key")
        root.add_third_party_caveat(
            "login.ubuntu.com", "caveat-key", "caveat-id"
        )
        discharge = Macaroon(
            location="login.ubuntu.com",
            identifier="caveat-id",
            key="caveat-key",
        )

        with self.client.session_transaction() as s:
            s["publisher"] = {
                "image": None,
                "nickname": "Toto",
                "fullname": "El Toto",
                "email": "testing@testing.com",
                "stores": [],
            }
            s["macaroon_exchanged"] = "exchanged-macaroon"

        if with_sca_cookies:
            self.client.set_cookie(
                SCA_ROOT_COOKIE, root.serialize(), path="/packages"
            )
            self.client.set_cookie(
                SCA_DISCHARGE_COOKIE, discharge.serialize(), path="/packages"
            )

    @responses.activate
    def test_unregister_sends_sca_style_header_not_exchanged_macaroon(self):
        # Regression test: SCA rejects the exchanged macaroon, so the
        # request must carry the bound root+discharge header even though
        # macaroon_exchanged is also present in session.
        self._log_in()
        responses.add(responses.DELETE, PUBLISHERGW_URL, json={}, status=200)

        response = self.client.delete(self.endpoint_url)

        assert response.status_code == 200
        sent_header = responses.calls[0].request.headers.get("Authorization")
        assert sent_header.startswith("macaroon root=")

    @responses.activate
    def test_unregister_without_sca_cookies_signals_reauth_required(self):
        # Without the SCA cookies (e.g. an old session from before this
        # fix), there's nothing to bind the SCA header with, so the
        # exchanged macaroon is sent and SCA rejects it. Rather than
        # surfacing that raw error, the user is told to log in again.
        self._log_in(with_sca_cookies=False)
        responses.add(
            responses.DELETE,
            PUBLISHERGW_URL,
            json={"error-list": [{"message": "Macaroon not valid"}]},
            status=401,
        )

        response = self.client.delete(self.endpoint_url)

        assert response.status_code == 401
        assert response.get_json() == {"reauth_required": True}
        sent_header = responses.calls[0].request.headers.get("Authorization")
        assert sent_header == "Macaroon exchanged-macaroon"

        with self.client.session_transaction() as s:
            assert "macaroon_exchanged" not in s

        cookie_headers = response.headers.get_all("Set-Cookie")
        assert any(
            header.startswith(f"{SCA_ROOT_COOKIE}=")
            for header in cookie_headers
        )
        assert any(
            header.startswith(f"{SCA_DISCHARGE_COOKIE}=")
            for header in cookie_headers
        )

    @responses.activate
    def test_unregister_returns_upstream_error(self):
        self._log_in()
        responses.add(
            responses.DELETE,
            PUBLISHERGW_URL,
            json={
                "error-list": [{"message": "Snap could not be unregistered"}]
            },
            status=400,
        )

        response = self.client.delete(self.endpoint_url)

        assert response.status_code == 400
        assert response.get_json() == {
            "error": "Snap could not be unregistered"
        }

    def test_unregister_not_logged_in(self):
        response = self.client.delete(self.endpoint_url)

        assert response.status_code == 302
