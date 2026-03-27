import unittest

from webapp.authentication import (
    SESSION_AUTH_KEYS,
    SESSION_INTEGRATION_KEYS,
    SESSION_DATA_KEYS,
    empty_session,
    reset_auth_session,
)


class TestResetAuthSession(unittest.TestCase):
    def test_reset_auth_session_clears_auth_keys(self):
        session = {key: "value" for key in SESSION_AUTH_KEYS}
        reset_auth_session(session)
        for key in SESSION_AUTH_KEYS:
            self.assertNotIn(key, session)

    def test_reset_auth_session_preserves_integration_keys(self):
        session = {}
        session["github_auth_secret"] = "gh-token-123"
        for key in SESSION_AUTH_KEYS:
            session[key] = "value"

        reset_auth_session(session)

        self.assertEqual(session["github_auth_secret"], "gh-token-123")
        for key in SESSION_AUTH_KEYS:
            self.assertNotIn(key, session)

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
