import responses
from flask_testing import TestCase
from pymacaroons import Macaroon

from webapp.app import create_app

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

    def _log_in(self):
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
            s["macaroon_root"] = root.serialize()
            s["macaroon_discharge"] = discharge.serialize()
            s["macaroon_exchanged"] = "exchanged-macaroon"

    @responses.activate
    def test_unregister_sends_sca_style_header_not_exchanged_macaroon(self):
        # Regression test: SCA rejects the exchanged macaroon, so the request
        # must carry the bound root+discharge header even though
        # macaroon_exchanged is also present in session.
        self._log_in()
        responses.add(responses.DELETE, PUBLISHERGW_URL, json={}, status=200)

        response = self.client.delete(self.endpoint_url)

        assert response.status_code == 200
        sent_header = responses.calls[0].request.headers.get("Authorization")
        assert sent_header.startswith("macaroon root=")

    @responses.activate
    def test_package_metadata_still_sends_exchanged_token_not_sca_header(
        self,
    ):
        # Regression test: unlike unregister, get_package_metadata hits
        # api.charmhub.io with the exchanged developer token, via a separate
        # code path (session["developer_token"]) that the SCA header-priority
        # fix above must not affect, even though root+discharge are also
        # present in session.
        self._log_in()
        responses.add(
            responses.GET,
            PUBLISHERGW_URL,
            json={"metadata": {"name": "test-snap"}},
            status=200,
        )

        response = self.client.get(f"/api/packages/{self.snap_name}")

        assert response.status_code == 200
        sent_header = responses.calls[0].request.headers.get("Authorization")
        assert sent_header == "Macaroon exchanged-macaroon"

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
