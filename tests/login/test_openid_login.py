import base64
import pickle
import time
from urllib.parse import parse_qsl, urlparse
from unittest.mock import patch

from flask_testing import TestCase
from openid.association import Association
from openid.consumer.consumer import AuthRequest
from openid.consumer.discover import OpenIDServiceEndpoint, OPENID_2_0_TYPE
from openid.extensions.sreg import ns_uri_1_1 as sreg_ns_uri
from openid.fetchers import HTTPResponse
from openid.message import Message, OPENID2_NS, OPENID_NS
from openid.store.nonce import mkNonce
from pymacaroons import Macaroon

from webapp import authentication
from webapp.app import create_app
from webapp.login.macaroon import MacaroonResponse
from webapp.login.teams import TeamsResponse, ns_uri
from webapp.login.views import open_id


class OpenIDLoginTest(TestCase):
    """Exercise real consumer verification and Flask-OpenID extension parsing.

    Only the OpenID HTTP boundary is simulated. The provider fixture verifies
    signatures rather than returning unconditional authentication success.
    Dashboard calls are isolated separately from the authentication path.
    """

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "test_key"
        # Preserve the actual HTTP 500 for upstream's unsigned-extension error.
        app.config["PROPAGATE_EXCEPTIONS"] = False
        return app

    def setUp(self):
        self.endpoint = OpenIDServiceEndpoint()
        self.endpoint.server_url = "https://login.ubuntu.com/"
        self.endpoint.claimed_id = "https://login.ubuntu.com/test-user"
        self.endpoint.local_id = self.endpoint.claimed_id
        self.endpoint.type_uris = [OPENID_2_0_TYPE]
        self.return_to = "http://localhost/login?openid_complete=yes"
        self.association = Association(
            "test-association",
            b"test-only-provider-secret-32bytes!",
            int(time.time()),
            600,
            "HMAC-SHA256",
        )
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

        for name, value in [
            ("ENVIRONMENT", "production"),
            (
                "dashboard.get_account",
                {
                    "username": "test-user",
                    "displayname": "Test User",
                    "email": "test@canonical.com",
                    "stores": [],
                },
            ),
            ("dashboard.get_validation_sets", None),
        ]:
            target = "webapp.login.views." + name
            mock = (
                patch(target, value)
                if name == "ENVIRONMENT"
                else patch(target, return_value=value)
            )
            mock.start()
            self.addCleanup(mock.stop)

        exchange = patch(
            "webapp.login.views.publisher_gateway"
            ".exchange_dashboard_macaroons",
            return_value="exchanged-token",
        )
        self.exchange = exchange.start()
        self.exchange.side_effect = self.exchange_macaroons
        self.addCleanup(exchange.stop)
        fetch = patch("openid.fetchers.fetch", side_effect=self.provider_fetch)
        self.fetch = fetch.start()
        self.addCleanup(fetch.stop)

    def exchange_macaroons(self, session):
        # The root and real SSO discharge reach token exchange unchanged.
        self.assertEqual(session["macaroon_root"], self.root)
        self.assertEqual(session["macaroon_discharge"], self.discharge)
        return "exchanged-token"

    def prepare_session(self):
        with self.client.session_transaction() as session:
            session.clear()
            session["macaroon_root"] = self.root
            # Same endpoint serialization as Flask-OpenID's SessionWrapper;
            # represents discovery completed before the SSO round trip.
            session["lt"] = {
                " p": base64.b64encode(pickle.dumps(self.endpoint, 0)).decode(
                    "utf-8"
                )
            }

    def assertion(self, membership="canonical", alias="lp", unsigned=()):
        args = {
            "openid.ns": OPENID2_NS,
            "openid.mode": "id_res",
            "openid.op_endpoint": self.endpoint.server_url,
            "openid.claimed_id": self.endpoint.claimed_id,
            "openid.identity": self.endpoint.local_id,
            "openid.return_to": self.return_to,
            "openid.response_nonce": mkNonce(),
            "openid.ns.sreg": sreg_ns_uri,
            "openid.sreg.nickname": "test-user",
            "openid.sreg.fullname": "Test User",
            "openid.sreg.email": "test@canonical.com",
            "openid.ns.macaroon": MacaroonResponse.ns_uri,
            "openid.macaroon.discharge": self.discharge,
        }
        if membership is not None:
            args["openid.ns." + alias] = ns_uri
            args["openid." + alias + ".is_member"] = membership
        if "lp.extra" in unsigned:
            args["openid.lp.extra"] = "unsigned-extra"
        message = self.association.signMessage(Message.fromPostArgs(args))
        if unsigned:
            fields = message.getArg(OPENID_NS, "signed").split(",")
            message.setArg(
                OPENID_NS,
                "signed",
                ",".join(field for field in fields if field not in unsigned),
            )
            message.setArg(
                OPENID_NS,
                "sig",
                self.association.getMessageSignature(message),
            )
        return message.toPostArgs()

    def provider_fetch(self, url, body=None, headers=None):
        self.assertEqual(url, self.endpoint.server_url)
        self.assertIsNotNone(body)
        message = Message.fromPostArgs(dict(parse_qsl(body)))
        self.assertEqual(
            message.getArg(OPENID_NS, "mode"), "check_authentication"
        )
        self.assertEqual(
            message.getArg(OPENID_NS, "assoc_handle"),
            self.association.handle,
        )
        # As an OpenID provider does, verify the original id_res assertion,
        # not the check_authentication request's substituted mode.
        message.setArg(OPENID_NS, "mode", "id_res")
        valid = self.association.checkMessageSignature(message)
        return HTTPResponse(
            final_url=url,
            status=200,
            headers={"content-type": "text/plain"},
            body=(
                "ns:%s\nis_valid:%s\n"
                % (OPENID2_NS, "true" if valid else "false")
            ).encode("utf-8"),
        )

    def callback(self, args):
        self.prepare_session()
        return self.client.get(
            "/login", query_string={"openid_complete": "yes", **args}
        )

    def assert_not_authenticated(self):
        self.exchange.assert_not_called()
        with self.client.session_transaction() as session:
            self.assertNotIn("publisher", session)
            self.assertNotIn("macaroon_exchanged", session)
            self.assertNotIn("macaroon_discharge", session)
            self.assertFalse(authentication.is_authenticated(session))

    def test_signed_team_response_establishes_canonical_login(self):
        for alias in ["lp", "teams"]:
            with self.subTest(alias=alias):
                response = self.callback(self.assertion(alias=alias))
                self.assertEqual(response.status_code, 302)
                self.assertEqual(response.location, "http://localhost/")
                with self.client.session_transaction() as session:
                    self.assertTrue(authentication.is_authenticated(session))
                    self.assertTrue(session["publisher"]["is_canonical"])
                    self.assertEqual(
                        session["publisher"]["identity_url"],
                        self.endpoint.claimed_id,
                    )
                    self.assertEqual(
                        session["macaroon_exchanged"], "exchanged-token"
                    )
                    self.assertNotIn("macaroon_root", session)
                    self.assertNotIn("macaroon_discharge", session)
        self.assertEqual(self.fetch.call_count, 2)
        self.assertEqual(self.exchange.call_count, 2)

    def test_empty_absent_or_other_team_does_not_authorize_canonical(self):
        for membership in ["", None, "other-team", "not-canonical"]:
            with self.subTest(membership=membership):
                response = self.callback(self.assertion(membership))
                self.assertEqual(response.status_code, 302)
                with self.client.session_transaction() as session:
                    self.assertTrue(authentication.is_authenticated(session))
                    # A Canonical email alone must not authorize production.
                    self.assertFalse(session["publisher"]["is_canonical"])

    def assert_teams_rejected(self, unsigned):
        with self.assertLogs(self.app.logger, level="ERROR") as logs:
            response = self.callback(self.assertion(unsigned=unsigned))
        self.assertEqual(response.status_code, 500)
        self.assertIs(logs.records[0].exc_info[0], TypeError)
        traceback = logs.records[0].exc_info[2]
        while traceback.tb_next:
            traceback = traceback.tb_next
        self.assertEqual(
            traceback.tb_frame.f_code.co_name, "fromSuccessResponse"
        )
        self.assertTrue(
            traceback.tb_frame.f_code.co_filename.endswith("/teams.py")
        )
        self.fetch.assert_called_once()
        self.assert_not_authenticated()

    def test_unsigned_membership_fails_before_establishing_login(self):
        self.assert_teams_rejected(["lp.is_member"])

    def test_partially_signed_teams_fails_before_establishing_login(self):
        self.assert_teams_rejected(["lp.extra"])

    def test_tampered_signed_membership_is_rejected_by_provider(self):
        args = self.assertion(membership="other-team")
        args["openid.lp.is_member"] = "canonical"
        response = self.callback(args)
        self.assertEqual(response.status_code, 302)
        self.fetch.assert_called_once()
        self.assert_not_authenticated()
        with self.client.session_transaction() as session:
            self.assertIn("authentication failure", session["openid_error"])

    def test_tampered_signed_namespace_is_rejected_by_provider(self):
        args = self.assertion(alias="teams")
        args["openid.ns.teams"] = "https://example.com/not-teams"
        response = self.callback(args)
        self.assertEqual(response.status_code, 302)
        self.fetch.assert_called_once()
        self.assert_not_authenticated()

    def test_tampered_macaroon_discharge_is_rejected_by_provider(self):
        args = self.assertion()
        args["openid.macaroon.discharge"] = "tampered-discharge"
        response = self.callback(args)
        self.assertEqual(response.status_code, 302)
        self.assert_not_authenticated()

    def test_unsigned_macaroon_discharge_cannot_establish_login(self):
        response = self.callback(
            self.assertion(unsigned=["macaroon.discharge"])
        )
        self.assertEqual(response.status_code, 500)
        self.assert_not_authenticated()

    def test_cancelled_assertion_does_not_parse_extension_or_log_in(self):
        args = self.assertion()
        args["openid.mode"] = "cancel"
        response = self.callback(args)
        self.assertEqual(response.status_code, 302)
        self.fetch.assert_not_called()
        self.assert_not_authenticated()

    def test_missing_signature_is_rejected_before_extension_parsing(self):
        args = self.assertion()
        del args["openid.sig"]
        response = self.callback(args)
        self.assertEqual(response.status_code, 302)
        self.fetch.assert_not_called()
        self.assert_not_authenticated()

    def test_login_request_preserves_teams_profile_and_macaroon_extensions(
        self,
    ):
        request = AuthRequest(self.endpoint, None)
        with patch(
            "webapp.login.views.authentication.request_macaroon",
            return_value=self.root,
        ), patch("flask_openid.Consumer.begin", return_value=request):
            response = self.client.get("/login?next=/snaps")
        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            urlparse(response.location).netloc, "login.ubuntu.com"
        )
        args = dict(parse_qsl(urlparse(response.location).query))
        self.assertEqual(args["openid.ns.lp"], ns_uri)
        self.assertEqual(args["openid.lp.query_membership"], "canonical")
        self.assertEqual(args["openid.ns.macaroon"], MacaroonResponse.ns_uri)
        self.assertEqual(args["openid.macaroon.caveat_id"], "caveat-id")
        self.assertEqual(
            set(args["openid.sreg.required"].split(",")), {"email", "nickname"}
        )
        self.assertEqual(args["openid.sreg.optional"], "fullname")
        self.assertEqual(
            open_id.extension_responses, [MacaroonResponse, TeamsResponse]
        )
        self.assertIsNone(open_id.store_factory())
        with self.client.session_transaction() as session:
            self.assertEqual(session["macaroon_root"], self.root)
        self.fetch.assert_not_called()
