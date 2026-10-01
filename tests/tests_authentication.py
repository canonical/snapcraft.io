import unittest

from pymacaroons import Macaroon

from webapp.authentication import (
    SESSION_AUTH_KEYS,
    SESSION_INTEGRATION_KEYS,
    SESSION_DATA_KEYS,
    empty_session,
    get_authorization_header,
    get_session_authorization_headers,
    is_authenticated,
    reset_auth_session,
)


class TestResetAuthSession(unittest.TestCase):
    def test_reset_auth_session_clears_auth_keys(self):
        session = {key: "value" for key in SESSION_AUTH_KEYS}
        reset_auth_session(session)
        for key in SESSION_AUTH_KEYS:
            self.assertNotIn(key, session)

    def test_reset_auth_session_preserves_integration_keys(self):
        session = {key: f"{key}-value" for key in SESSION_INTEGRATION_KEYS}
        reset_auth_session(session)
        for key in SESSION_INTEGRATION_KEYS:
            self.assertEqual(session[key], f"{key}-value")

    def test_empty_session_clears_everything(self):
        session = {key: "value" for key in SESSION_DATA_KEYS}
        empty_session(session)
        for key in SESSION_DATA_KEYS:
            self.assertNotIn(key, session)

    def test_session_data_keys_is_union(self):
        self.assertEqual(
            set(SESSION_DATA_KEYS),
            set(SESSION_AUTH_KEYS) | set(SESSION_INTEGRATION_KEYS),
        )

    def test_session_keys_are_disjoint(self):
        self.assertEqual(
            set(SESSION_AUTH_KEYS).intersection(set(SESSION_INTEGRATION_KEYS)),
            set(),
        )

    def test_get_authorization_header_uses_single_exchanged_macaroon(self):
        self.assertEqual(
            get_authorization_header("test-macaroon"),
            "Macaroon test-macaroon",
        )

    def test_is_authenticated_with_exchanged_macaroon(self):
        self.assertTrue(
            is_authenticated(
                {
                    "publisher": {"nickname": "test"},
                    "macaroon_exchanged": "test-macaroon",
                }
            )
        )

    def test_is_authenticated_with_legacy_macaroons(self):
        self.assertTrue(
            is_authenticated(
                {
                    "publisher": {"nickname": "test"},
                    "macaroons": "legacy-macaroon",
                }
            )
        )

    def test_get_session_authorization_headers_prefers_root_and_discharge(
        self,
    ):
        # SCA (dashboard.snapcraft.io) only accepts the bound root+discharge
        # header; the single exchanged macaroon is not valid for it, so it
        # must not be picked even when both are present in session.
        root = Macaroon(location="store", identifier="root", key="root-key")
        root.add_third_party_caveat(
            "login.ubuntu.com", "caveat-key", "caveat-id"
        )
        discharge = Macaroon(
            location="login.ubuntu.com",
            identifier="caveat-id",
            key="caveat-key",
        )

        headers = get_session_authorization_headers(
            {
                "macaroon_root": root.serialize(),
                "macaroon_discharge": discharge.serialize(),
                "macaroon_exchanged": "exchanged-macaroon",
            }
        )

        self.assertTrue(headers["Authorization"].startswith("macaroon root="))

    def test_get_session_authorization_headers_falls_back_to_exchanged(self):
        headers = get_session_authorization_headers(
            {"macaroon_exchanged": "exchanged-macaroon"}
        )

        self.assertEqual(
            headers, {"Authorization": "Macaroon exchanged-macaroon"}
        )
