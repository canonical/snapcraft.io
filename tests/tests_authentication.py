import unittest

from webapp.authentication import (
    SESSION_AUTH_KEYS,
    SESSION_INTEGRATION_KEYS,
    SESSION_DATA_KEYS,
    empty_session,
    get_authorization_header,
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
