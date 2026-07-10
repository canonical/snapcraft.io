import requests

import responses
from flask_testing import TestCase
from pymacaroons import Macaroon
from canonicalwebteam.exceptions import PublisherAgreementNotSigned
from webapp.app import create_app

from unittest.mock import patch, MagicMock


class LoginHandlerTest(TestCase):
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
            s["publisher"] = "openid"
            s["macaroon_exchanged"] = "macaroon_exchanged"

        response = self.client.get(self.endpoint_url)
        assert response.status_code == 302
        self.assertEqual("http://localhost/", response.location)

    def test_redirect_user_logged_in_next_url(self):
        with self.client.session_transaction() as s:
            s["publisher"] = "openid"
            s["macaroon_exchanged"] = "macaroon_exchanged"

        response = self.client.get(self.endpoint_url + "?next=/test")
        assert response.status_code == 302
        self.assertEqual("/test", response.location)

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
        self.assertEqual("/logout", response.location)

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


class AfterLoginHandlerTest(TestCase):
    def create_app(self):
        app = create_app(testing=True)

        # set up a fake route for testing the after_login function
        # since it is decorated with @open_id.after_login
        @app.route("/_test_after_login")
        def _test_after_login():
            from webapp.login.views import after_login

            return after_login(self.mock_resp)

        return app

    # creates a mocked responses for the get_account function
    # and the login response passed to after_login
    def prepare_mock_response(
        self, mock_get_account, email="test@test.com", groups=[]
    ):
        root = Macaroon(location="store", identifier="root", key="root-key")
        root.add_third_party_caveat(
            "login.ubuntu.com", "caveat-key", "caveat-id"
        )
        self.root_macaroon = root.serialize()
        discharge = Macaroon(
            location="login.ubuntu.com",
            identifier="caveat-id",
            key="caveat-key",
        ).serialize()

        self.mock_resp = MagicMock()
        self.mock_resp.nickname = "test"
        self.mock_resp.identity_url = "https://login.ubuntu.com/test"
        self.mock_resp.fullname = "Test"
        self.mock_resp.image = "test.png"
        self.mock_resp.email = email
        self.mock_resp.extensions = {
            "macaroon": MagicMock(discharge=discharge),
            "lp": MagicMock(is_member=groups),
        }

        mock_get_account.return_value = {
            "username": self.mock_resp.nickname,
            "displayname": self.mock_resp.fullname,
            "email": email,
            "stores": [],
        }

    @patch("webapp.login.views.ENVIRONMENT", "staging")
    @patch("webapp.login.views.dashboard.get_stores", return_value=[])
    @patch("webapp.login.views.logic.get_stores", return_value=[])
    @patch(
        "webapp.login.views.dashboard.get_validation_sets", return_value=None
    )
    @patch(
        "webapp.login.views.publisher_gateway.exchange_dashboard_macaroons",
        return_value="exchanged-macaroon",
    )
    @patch("webapp.login.views.dashboard.get_account")
    def test_is_canonical_true_if_email_ends_with_canonical_on_staging(
        self,
        mock_get_account,
        *_,
    ):
        # on test environments, we treat publisher's account as "canonical"
        # if their email is (at)canonical email
        self.prepare_mock_response(
            mock_get_account, email="test@canonical.com", groups=[]
        )

        with self.client.session_transaction() as s:
            s["macaroon_root"] = self.root_macaroon
        self.client.get("/_test_after_login")

        with self.client.session_transaction() as s:
            publisher = s.get("publisher")
            assert publisher is not None
            assert publisher["is_canonical"] is True
            assert s["macaroon_exchanged"] == "exchanged-macaroon"
            assert "macaroon_root" not in s
            assert "macaroon_discharge" not in s

    @patch("webapp.login.views.ENVIRONMENT", "production")
    @patch("webapp.login.views.dashboard.get_stores", return_value=[])
    @patch("webapp.login.views.logic.get_stores", return_value=[])
    @patch(
        "webapp.login.views.dashboard.get_validation_sets", return_value=None
    )
    @patch(
        "webapp.login.views.publisher_gateway.exchange_dashboard_macaroons",
        return_value="exchanged-macaroon",
    )
    @patch("webapp.login.views.dashboard.get_account")
    def test_is_canonical_true_if_member_of_team_on_production(
        self,
        mock_get_account,
        *_,
    ):
        # on production, we treat publisher's account as "canonical"
        # if they are a member of the canonical team
        self.prepare_mock_response(mock_get_account, groups=["canonical"])

        with self.client.session_transaction() as s:
            s["macaroon_root"] = self.root_macaroon
        self.client.get("/_test_after_login")

        with self.client.session_transaction() as s:
            publisher = s.get("publisher")
            assert publisher is not None
            assert publisher["is_canonical"] is True

    @patch("webapp.login.views.ENVIRONMENT", "production")
    @patch("webapp.login.views.dashboard.get_stores", return_value=[])
    @patch("webapp.login.views.logic.get_stores", return_value=[])
    @patch(
        "webapp.login.views.dashboard.get_validation_sets", return_value=None
    )
    @patch(
        "webapp.login.views.publisher_gateway.exchange_dashboard_macaroons",
        return_value="exchanged-macaroon",
    )
    @patch("webapp.login.views.dashboard.get_account")
    def test_is_canonical_false_if_not_member_of_team_on_production(
        self,
        mock_get_account,
        *_,
    ):
        # on production, we treat publisher's account as "canonical"
        # only if they are a member of the canonical team, not based on email
        self.prepare_mock_response(
            mock_get_account, email="test@canonical.com", groups=[]
        )

        with self.client.session_transaction() as s:
            s["macaroon_root"] = self.root_macaroon
        self.client.get("/_test_after_login")

        with self.client.session_transaction() as s:
            publisher = s.get("publisher")
            assert publisher is not None
            assert publisher["is_canonical"] is False

    def test_after_login_exchanges_macaroons_and_clears_root_and_discharge(
        self,
    ):
        self.prepare_mock_response(MagicMock(), groups=["canonical"])

        with patch(
            "webapp.login.views.dashboard.get_account",
            return_value={
                "username": "test",
                "displayname": "Test",
                "email": "test@test.com",
                "stores": [],
            },
        ), patch(
            "webapp.login.views.dashboard.get_validation_sets",
            return_value=None,
        ), patch(
            "webapp.login.views.dashboard.get_stores", return_value=[]
        ), patch(
            "webapp.login.views.logic.get_stores", return_value=[]
        ), patch(
            "webapp.login.views.publisher_gateway"
            ".exchange_dashboard_macaroons",
            return_value="exchanged-macaroon",
        ) as mock_exchange:
            with self.client.session_transaction() as s:
                s["macaroon_root"] = self.root_macaroon

            response = self.client.get("/_test_after_login")

            assert response.status_code == 302
            with self.client.session_transaction() as s:
                assert s["macaroon_exchanged"] == "exchanged-macaroon"
                assert "macaroon_root" not in s
                assert "macaroon_discharge" not in s

            mock_exchange.assert_called_once()

    @patch("webapp.login.views.dashboard.get_validation_sets")
    @patch("webapp.login.views.dashboard.get_account")
    @patch(
        "webapp.login.views.publisher_gateway" ".exchange_dashboard_macaroons",
        return_value="exchanged-macaroon",
    )
    def test_after_login_agreement_not_signed_keeps_user_authenticated(
        self,
        _mock_exchange,
        mock_get_account,
        _mock_validation_sets,
    ):
        # Regression test for issue #5788: a publisher who has not yet
        # accepted the developer Terms & Conditions must still end up with an
        # authenticated session and be guided to the agreement page, rather
        # than dead-ending in a redirect loop / 404.
        self.prepare_mock_response(MagicMock(), groups=[])
        mock_get_account.side_effect = PublisherAgreementNotSigned

        with self.client.session_transaction() as s:
            s["macaroon_root"] = self.root_macaroon

        response = self.client.get("/_test_after_login")

        assert response.status_code == 302
        assert response.location == "/account/agreement"

        with self.client.session_transaction() as s:
            publisher = s.get("publisher")
            assert publisher is not None
            assert publisher["nickname"] == self.mock_resp.nickname
            assert publisher["email"] == self.mock_resp.email
            assert s["macaroon_exchanged"] == "exchanged-macaroon"
