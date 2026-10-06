import time
from types import SimpleNamespace
from unittest.mock import patch

import responses
from flask_testing import TestCase
from openid.consumer.consumer import SUCCESS
from pymacaroons import Macaroon

from webapp.app import create_app
from webapp.extensions import csrf


class DeletePackageTest(TestCase):
    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "test_key"
        return app

    def setUp(self):
        account = patch(
            "webapp.publisher.snaps.views.dashboard.get_account",
            return_value={"snaps": {}},
        )
        account.start()
        self.addCleanup(account.stop)
        self.identity_url = "https://login.ubuntu.com/test-user"
        self.api_url = "https://api.charmhub.io/v1/snap/test-snap"
        root = Macaroon(location="store", identifier="root", key="root-key")
        root.add_third_party_caveat(
            "login.ubuntu.com", "caveat-key", "caveat-id"
        )
        self.root = root.serialize()
        self.discharge = Macaroon(
            location="login.ubuntu.com",
            identifier="caveat-id",
            key="caveat-key",
        ).serialize()
        self.resp = SimpleNamespace(
            identity_url=self.identity_url,
            extensions={"macaroon": SimpleNamespace(discharge=self.discharge)},
        )
        with self.client.session_transaction() as session:
            session["publisher"] = {
                "identity_url": self.identity_url,
                "email": "test@example.com",
                "nickname": "test-user",
                "fullname": "Test User",
                "image": None,
                "stores": [],
            }
            session["macaroon_exchanged"] = "exchanged-token"

    def initiate(self):
        response = self.client.delete("/packages/test-snap")
        self.assertEqual(response.status_code, 202)
        data = response.get_json()
        self.assertTrue(data["authorization_required"])
        return data["redirect_url"]

    def prepare_callback(self):
        url = self.initiate()
        with self.client.session_transaction() as session:
            session["pending_snap_unregister"]["root_macaroon"] = self.root
            session.modified = True
        return url

    def callback(self, url, resp=None):
        with (
            patch("flask_openid.Consumer") as consumer,
            patch(
                "flask_openid.OpenIDResponse",
                return_value=resp or self.resp,
            ),
        ):
            consumer.return_value.complete.return_value.status = SUCCESS
            return self.client.get(f"{url}?openid_complete=yes")

    def assert_credentials_discarded(self):
        with self.client.session_transaction() as session:
            self.assertNotIn("pending_snap_unregister", session)
            self.assertNotIn("macaroon_root", session)
            self.assertNotIn("macaroon_discharge", session)
            self.assertEqual(session["macaroon_exchanged"], "exchanged-token")
            self.assertEqual(
                session["publisher"]["identity_url"], self.identity_url
            )

    @responses.activate
    def test_confirmation_defers_upstream_delete(self):
        self.initiate()
        self.assertEqual(len(responses.calls), 0)
        with self.client.session_transaction() as session:
            pending = session["pending_snap_unregister"]
            self.assertEqual(pending["snap_name"], "test-snap")
            self.assertEqual(pending["identity_url"], self.identity_url)
            self.assertGreater(pending["expires_at"], time.time())
            self.assertNotIn("root_macaroon", pending)
            self.assertNotIn("developer_token", session)

    @patch("webapp.login.views.open_id.try_login")
    @patch("webapp.login.views.authentication.request_macaroon")
    def test_authorization_requests_fresh_discharge(self, request, try_login):
        url = self.initiate()
        request.return_value = self.root
        try_login.return_value = ("", 302)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 302)
        request.assert_called_once_with()
        self.assertEqual(
            try_login.call_args.kwargs["extensions"][0].caveat_id,
            "caveat-id",
        )
        with self.client.session_transaction() as session:
            self.assertEqual(
                session["pending_snap_unregister"]["root_macaroon"],
                self.root,
            )
            self.assertEqual(session["macaroon_exchanged"], "exchanged-token")

    @responses.activate
    def test_callback_unregisters_with_bound_legacy_credentials(self):
        url = self.prepare_callback()
        bound = Macaroon.deserialize(self.root).prepare_for_request(
            Macaroon.deserialize(self.discharge)
        )
        responses.add(
            responses.DELETE,
            self.api_url,
            json={},
            status=200,
            match=[
                responses.matchers.header_matcher(
                    {
                        "Authorization": (
                            f"macaroon root={self.root}, "
                            f"discharge={bound.serialize()}"
                        )
                    }
                )
            ],
        )
        response = self.callback(url)
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.location, "/snaps")
        self.assertEqual(len(responses.calls), 1)
        self.assert_credentials_discarded()
        with self.client.session_transaction() as session:
            self.assertIn(
                ("positive", "test-snap has been unregistered."),
                session["_flashes"],
            )

    @responses.activate
    def test_upstream_error_is_shown_and_credentials_discarded(self):
        url = self.prepare_callback()
        responses.add(
            responses.DELETE,
            self.api_url,
            json={"error-list": [{"message": "Cannot unregister this snap"}]},
            status=400,
        )
        self.callback(url)
        self.assert_credentials_discarded()
        with self.client.session_transaction() as session:
            self.assertIn(
                ("negative", "Cannot unregister this snap"),
                session["_flashes"],
            )

    @responses.activate
    def test_expired_callback_does_not_unregister(self):
        url = self.prepare_callback()
        with self.client.session_transaction() as session:
            session["pending_snap_unregister"]["expires_at"] = time.time() - 1
            session.modified = True
        self.callback(url)
        self.assertEqual(len(responses.calls), 0)
        self.assert_credentials_discarded()

    @responses.activate
    def test_different_sso_identity_does_not_unregister(self):
        url = self.prepare_callback()
        self.resp.identity_url = "https://login.ubuntu.com/another-user"
        self.callback(url)
        self.assertEqual(len(responses.calls), 0)
        self.assert_credentials_discarded()

    @responses.activate
    def test_changed_session_identity_does_not_unregister(self):
        url = self.prepare_callback()
        with self.client.session_transaction() as session:
            session["publisher"]["identity_url"] = "another-user"
            session.modified = True
        self.callback(url)
        self.assertEqual(len(responses.calls), 0)
        with self.client.session_transaction() as session:
            self.assertNotIn("pending_snap_unregister", session)

    @responses.activate
    def test_missing_or_wrong_action_does_not_unregister(self):
        url = self.prepare_callback()
        self.callback("/login/unregister-snap/wrong-action")
        self.callback(url)
        self.assertEqual(len(responses.calls), 0)
        self.assert_credentials_discarded()

    @responses.activate
    def test_second_callback_does_not_unregister_again(self):
        url = self.prepare_callback()
        responses.add(responses.DELETE, self.api_url, json={}, status=200)
        self.callback(url)
        self.callback(url)
        self.assertEqual(len(responses.calls), 1)

    def test_overlapping_confirmation_does_not_replace_pending_action(self):
        self.initiate()
        response = self.client.delete("/packages/another-snap")
        self.assertEqual(response.status_code, 409)
        with self.client.session_transaction() as session:
            self.assertEqual(
                session["pending_snap_unregister"]["snap_name"], "test-snap"
            )

    def test_cancelled_sso_cleans_up_and_preserves_login(self):
        url = self.prepare_callback()
        response = self.client.get(
            f"{url}?openid_complete=yes&openid.mode=cancel"
        )
        self.assertEqual(response.status_code, 302)
        response = self.client.get(response.location)
        self.assertEqual(response.location, "/snaps")
        self.assert_credentials_discarded()

    def test_logout_discards_pending_action(self):
        self.prepare_callback()
        self.client.get("/logout")
        with self.client.session_transaction() as session:
            self.assertNotIn("pending_snap_unregister", session)

    def test_abandoned_credentials_are_removed_on_next_request_after_expiry(
        self,
    ):
        self.prepare_callback()
        with self.client.session_transaction() as session:
            session["pending_snap_unregister"]["expires_at"] = time.time() - 1
            session.modified = True
        self.client.get("/snaps")
        self.assert_credentials_discarded()

    @responses.activate
    def test_missing_discharge_does_not_unregister(self):
        url = self.prepare_callback()
        self.resp.extensions = {}
        self.callback(url)
        self.assertEqual(len(responses.calls), 0)
        self.assert_credentials_discarded()

    @patch("webapp.login.views.open_id.try_login")
    @patch("webapp.login.views.authentication.request_macaroon")
    def test_normal_cookie_restored_after_completion(self, request, try_login):
        with self.client.session_transaction() as session:
            initial = dict(session)
        url = self.initiate()
        request.return_value = self.root
        try_login.return_value = ("", 302)
        self.client.get(url)
        with responses.RequestsMock() as mocked:
            mocked.add(responses.DELETE, self.api_url, json={}, status=200)
            self.callback(url)
        response = self.client.get("/snaps")
        self.assertIn(b"test-snap has been unregistered.", response.data)
        with self.client.session_transaction() as session:
            self.assertEqual(dict(session), initial)

    def test_unauthenticated_confirmation_redirects_to_login(self):
        self.client.get("/logout")
        response = self.client.delete("/packages/test-snap")
        self.assertEqual(response.status_code, 302)
        self.assertIn("/login", response.location)

    def test_confirmation_requires_csrf(self):
        csrf.init_app(self.app)
        response = self.client.delete("/packages/test-snap")
        self.assertEqual(response.status_code, 400)
        with self.client.session_transaction() as session:
            self.assertNotIn("pending_snap_unregister", session)

    @responses.activate
    def test_legacy_session_still_unregisters_directly(self):
        with self.client.session_transaction() as session:
            session["macaroon_root"] = self.root
            session["macaroon_discharge"] = self.discharge
        responses.add(responses.DELETE, self.api_url, json={}, status=200)
        response = self.client.delete("/packages/test-snap")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            responses.calls[0]
            .request.headers["Authorization"]
            .startswith("macaroon root=")
        )
