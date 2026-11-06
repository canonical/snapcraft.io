"""Offline regression tests for #5957's agreement/token-exchange recovery.

Uses the real Flask routes, templates and Store API response parser. All HTTP
responses are synthetic and socket connections are forbidden. No real accounts
are created and no legal agreement is accepted with an external service.
"""

import json
from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import patch

import responses
from pymacaroons import Macaroon


class AccountOnboardingReproductionTest(TestCase):
    def setUp(self):
        for operation in ("connect", "connect_ex", "sendto"):
            network = patch(
                f"socket.socket.{operation}",
                side_effect=AssertionError(
                    "Network forbidden in offline repro"
                ),
            )
            network.start()
            self.addCleanup(network.stop)
        self.http = responses.RequestsMock(assert_all_requests_are_fired=True)
        self.http.start()
        self.addCleanup(self.http.stop)

        # Metrics are unrelated to onboarding; do not emit UDP packets.
        metrics_send = patch("statsd.StatsClient._send")
        metrics_send.start()
        self.addCleanup(metrics_send.stop)

        # The app probes Redis during import; use its in-memory fallback.
        from redis.exceptions import ConnectionError as RedisConnectionError

        redis_ping = patch(
            "redis.Redis.ping",
            side_effect=RedisConnectionError("Offline reproduction"),
        )
        redis_ping.start()
        self.addCleanup(redis_ping.stop)

        from webapp.app import create_app
        from webapp.login import views as login_views
        from webapp.publisher import views as account_views
        from webapp import decorators, helpers

        self.app = create_app(testing=True)
        self.app.secret_key = "offline-reproduction-only"
        self.client = self.app.test_client()
        self.exchange_url = login_views.publisher_gateway.get_endpoint_url(
            "tokens/dashboard/exchange"
        )
        self.agreement_url = account_views.dashboard.get_endpoint_url(
            "agreement/"
        )
        self.account_url = helpers.dashboard.get_endpoint_url("account")
        self.assertEqual(
            self.exchange_url,
            decorators.publisher_gateway.get_endpoint_url(
                "tokens/dashboard/exchange"
            ),
        )

        root = Macaroon(
            location="offline-store", identifier="root", key="root-key"
        )
        root.add_third_party_caveat(
            "login.ubuntu.com", "caveat-key", "caveat-id"
        )
        self.root = root.serialize()
        self.discharge = Macaroon(
            location="login.ubuntu.com",
            identifier="caveat-id",
            key="caveat-key",
        ).serialize()
        self.identity = SimpleNamespace(
            nickname="offline-publisher",
            identity_url="https://sso.example.invalid/offline-publisher",
            fullname="Offline Test Publisher",
            image=None,
            email="offline-publisher@example.invalid",
            extensions={
                "macaroon": SimpleNamespace(discharge=self.discharge),
                "lp": SimpleNamespace(is_member=[]),
            },
        )

        @self.app.route("/_test_after_login")
        def after_login_callback():
            return login_views.after_login(self.identity)

    def _add_exchange_error(self, code, message, status):
        self.http.add(
            responses.POST,
            self.exchange_url,
            json={"error-list": [{"code": code, "message": message}]},
            status=status,
        )

    def _seed_legacy_session(self):
        with self.client.session_transaction() as session:
            session["macaroon_root"] = self.root
            session["macaroon_discharge"] = self.discharge
            session["github_auth_secret"] = "offline-github-token"
            session["publisher"] = {
                "nickname": self.identity.nickname,
                "fullname": self.identity.fullname,
                "email": self.identity.email,
                "image": None,
            }

    def _new_publisher_without_agreement(self):
        # The real after_login route recognizes account-not-found as a new
        # publisher, preserving the original root/discharge for onboarding.
        self._add_exchange_error(
            "account-not-found",
            "The account specified in the dashboard macaroons was not found",
            404,
        )
        with self.client.session_transaction() as session:
            session["macaroon_root"] = self.root
            session["github_auth_secret"] = "offline-github-token"
        response = self.client.get("/_test_after_login")
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.location, "/account/agreement")
        with self.client.session_transaction() as session:
            self.assertIn("publisher", session)
            self.assertIn("macaroon_root", session)
            self.assertIn("macaroon_discharge", session)
            self.assertNotIn("macaroon_exchanged", session)
        return response

    def _accept_mock_agreement(self):
        self.http.add(responses.POST, self.agreement_url, json={}, status=200)
        response = self.client.post(
            "/account/agreement", data={"i_agree": "on"}
        )
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.location, "/account/")
        self.assertEqual(
            json.loads(self.http.calls[-1].request.body),
            {"latest_tos_accepted": True},
        )

    def _assert_expired_exchange_requires_login(self):
        from webapp.authentication import SESSION_AUTH_KEYS

        response = self.client.get("/admin/account")
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.location, "/login?next=/admin/account")
        self.assertNotIn(b"Please try again later", response.data)
        with self.client.session_transaction() as session:
            for key in SESSION_AUTH_KEYS:
                self.assertNotIn(key, session)
            self.assertEqual(
                session["github_auth_secret"], "offline-github-token"
            )
        return response

    def test_explicit_unsigned_agreement_redirects_instead_of_502(self):
        self._seed_legacy_session()
        self.http.add(
            responses.GET,
            self.account_url,
            json={
                "error_list": [
                    {
                        "code": "user-missing-latest-tos",
                        "message": "User has not signed agreement",
                    }
                ]
            },
            status=403,
        )
        response = self.client.get("/account/publisher")
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.location, "/account/agreement")
        agreement = self.client.get(response.location)
        self.assertEqual(agreement.status_code, 200)
        self.assertIn(b"Developer Programme Agreement", agreement.data)

    def test_new_publisher_is_sent_to_agreement(self):
        self._new_publisher_without_agreement()
        response = self.client.get("/account/agreement")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Developer Programme Agreement", response.data)
        self.assertEqual(len(self.http.calls), 1)

    def test_skipping_agreement_with_account_not_found_returns_404(self):
        self._new_publisher_without_agreement()
        response = self.client.get("/admin/account")
        self.assertEqual(response.status_code, 404)
        self.assertNotIn(b"Please try again later", response.data)
        self.assertEqual(len(self.http.calls), 2)

    def test_accepting_agreement_and_fresh_exchange_renders_admin(self):
        self._new_publisher_without_agreement()
        self._accept_mock_agreement()
        self.http.add(
            responses.POST,
            self.exchange_url,
            json={"macaroon": "offline-exchanged-token"},
            status=200,
        )
        response = self.client.get("/admin/account")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'<div id="root">', response.data)
        with self.client.session_transaction() as session:
            self.assertTrue(session["exchanged_developer_token"])
            self.assertEqual(
                session["developer_token"], "offline-exchanged-token"
            )

    def test_expired_exchange_before_agreement_requires_login(self):
        self._new_publisher_without_agreement()
        # Model the upstream rejection once the retained credentials can no
        # longer be exchanged. This does not measure the real expiry window.
        self._add_exchange_error(
            "unauthorized", "Exchange window expired", 401
        )
        self._assert_expired_exchange_requires_login()
        # Reloading the protected page must not retry the stale credential.
        count = len(self.http.calls)
        response = self.client.get("/admin/account")
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.location, "/login?next=/admin/account")
        self.assertEqual(len(self.http.calls), count)

    def test_expired_exchange_after_agreement_recovers_with_fresh_login(self):
        from flask import redirect

        self._new_publisher_without_agreement()
        self._accept_mock_agreement()
        self._add_exchange_error(
            "unauthorized", "Exchange window expired", 401
        )
        response = self._assert_expired_exchange_requires_login()

        fresh_root = Macaroon(
            location="offline-store", identifier="fresh-root", key="fresh-key"
        )
        fresh_root.add_third_party_caveat(
            "login.ubuntu.com", "caveat-key", "caveat-id"
        )
        fresh_root = fresh_root.serialize()
        # Only the OpenID transport is mocked. The real /login handler must
        # request new credentials rather than bounce back as authenticated.
        with patch(
            "webapp.authentication.request_macaroon", return_value=fresh_root
        ) as request_macaroon, patch(
            "webapp.login.views.open_id.try_login",
            return_value=redirect("https://sso.example.invalid/"),
        ) as try_login:
            login_response = self.client.get(response.location)
        self.assertEqual(login_response.status_code, 302)
        self.assertEqual(
            login_response.location, "https://sso.example.invalid/"
        )
        request_macaroon.assert_called_once_with()
        try_login.assert_called_once()
        with self.client.session_transaction() as session:
            self.assertEqual(session["macaroon_root"], fresh_root)
            self.assertNotIn("macaroon_discharge", session)

        self.http.add(
            responses.POST,
            self.exchange_url,
            json={"macaroon": "offline-fresh-token"},
            status=200,
        )
        self.http.add(
            responses.GET,
            self.account_url,
            json={
                "username": self.identity.nickname,
                "displayname": self.identity.fullname,
                "email": self.identity.email,
                "stores": [],
            },
            status=200,
        )
        with patch(
            "webapp.login.views.dashboard.get_validation_sets",
            return_value=None,
        ), patch(
            "webapp.login.views.open_id.get_next_url",
            return_value="/admin/account",
        ):
            response = self.client.get("/_test_after_login")
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.location, "/admin/account")
        response = self.client.get(response.location)
        self.assertEqual(response.status_code, 200)
        with self.client.session_transaction() as session:
            self.assertEqual(
                session["macaroon_exchanged"], "offline-fresh-token"
            )
            self.assertNotIn("macaroon_root", session)
            self.assertNotIn("macaroon_discharge", session)
            self.assertEqual(
                session["github_auth_secret"], "offline-github-token"
            )

    def test_unrelated_exchange_errors_do_not_clear_authentication(self):
        cases = [
            (401, "unauthorized", "Permission denied"),
            (403, "unauthorized", "Exchange window expired"),
            (401, "some-other-error", "Exchange window expired"),
        ]
        for status, code, message in cases:
            with self.subTest(status=status, code=code, message=message):
                self.http.reset()
                self._seed_legacy_session()
                self._add_exchange_error(code, message, status)
                response = self.client.get("/admin/account")
                self.assertEqual(response.status_code, 502)
                with self.client.session_transaction() as session:
                    self.assertIn("publisher", session)
                    self.assertEqual(session["macaroon_root"], self.root)

    def test_existing_macaroon_errors_still_require_login(self):
        for code in (
            "macaroon-permission-required",
            "macaroon-authorization-required",
        ):
            with self.subTest(code=code):
                self.http.reset()
                self._seed_legacy_session()
                self._add_exchange_error(code, "Reauthentication needed", 401)
                self._assert_expired_exchange_requires_login()
