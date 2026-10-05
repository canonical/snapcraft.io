import unittest

from pymacaroons import Macaroon

from webapp.app import create_app
from webapp.authentication import (
    SCA_AUTH_COOKIE_PATH,
    SCA_DISCHARGE_COOKIE,
    SCA_ROOT_COOKIE,
    SESSION_AUTH_KEYS,
    SESSION_INTEGRATION_KEYS,
    SESSION_DATA_KEYS,
    clear_sca_auth_cookies,
    empty_session,
    get_authorization_header,
    get_session_authorization_headers,
    is_authenticated,
    reset_auth_session,
    set_sca_auth_cookies,
)


def _make_root_and_discharge():
    root = Macaroon(location="store", identifier="root", key="root-key")
    root.add_third_party_caveat("login.ubuntu.com", "caveat-key", "caveat-id")
    discharge = Macaroon(
        location="login.ubuntu.com",
        identifier="caveat-id",
        key="caveat-key",
    )
    return root.serialize(), discharge.serialize()


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


class TestGetSessionAuthorizationHeaders(unittest.TestCase):
    def setUp(self):
        self.app = create_app(testing=True)
        self.app.secret_key = "secret_key"

    def test_prefers_cookie_root_and_discharge_over_exchanged_macaroon(self):
        # SCA (dashboard.snapcraft.io) rejects the exchanged macaroon, so
        # the bound root+discharge pair must win even when both are
        # present.
        root, discharge = _make_root_and_discharge()
        with self.app.test_request_context(
            headers={
                "Cookie": (
                    f"{SCA_ROOT_COOKIE}={root}; "
                    f"{SCA_DISCHARGE_COOKIE}={discharge}"
                )
            }
        ):
            headers = get_session_authorization_headers(
                {"macaroon_exchanged": "exchanged-macaroon"}
            )

        self.assertTrue(headers["Authorization"].startswith("macaroon root="))

    def test_falls_back_to_session_root_and_discharge_without_cookies(self):
        # The login handshake briefly keeps root+discharge in the session
        # before cookies are set on the response.
        root, discharge = _make_root_and_discharge()
        with self.app.test_request_context():
            headers = get_session_authorization_headers(
                {
                    "macaroon_root": root,
                    "macaroon_discharge": discharge,
                    "macaroon_exchanged": "exchanged-macaroon",
                }
            )

        self.assertTrue(headers["Authorization"].startswith("macaroon root="))

    def test_falls_back_to_exchanged_macaroon_without_root_and_discharge(
        self,
    ):
        with self.app.test_request_context():
            headers = get_session_authorization_headers(
                {"macaroon_exchanged": "exchanged-macaroon"}
            )

        self.assertEqual(
            headers, {"Authorization": "Macaroon exchanged-macaroon"}
        )


class TestScaAuthCookies(unittest.TestCase):
    def setUp(self):
        self.app = create_app(testing=True)
        self.app.secret_key = "secret_key"

    def test_set_sca_auth_cookies_scopes_cookies_to_packages_path(self):
        with self.app.test_request_context():
            response = self.app.make_response("")
            set_sca_auth_cookies(
                response, "root-macaroon", "discharge-macaroon"
            )

        cookie_headers = response.headers.get_all("Set-Cookie")
        self.assertTrue(
            any(
                f"{SCA_ROOT_COOKIE}=root-macaroon" in header
                and f"Path={SCA_AUTH_COOKIE_PATH}" in header
                and "HttpOnly" in header
                for header in cookie_headers
            )
        )
        self.assertTrue(
            any(
                f"{SCA_DISCHARGE_COOKIE}=discharge-macaroon" in header
                and f"Path={SCA_AUTH_COOKIE_PATH}" in header
                and "HttpOnly" in header
                for header in cookie_headers
            )
        )

    def test_clear_sca_auth_cookies_expires_both_cookies(self):
        with self.app.test_request_context():
            response = self.app.make_response("")
            clear_sca_auth_cookies(response)

        cookie_headers = response.headers.get_all("Set-Cookie")
        self.assertTrue(
            any(
                header.startswith(f"{SCA_ROOT_COOKIE}=")
                and f"Path={SCA_AUTH_COOKIE_PATH}" in header
                for header in cookie_headers
            )
        )
        self.assertTrue(
            any(
                header.startswith(f"{SCA_DISCHARGE_COOKIE}=")
                and f"Path={SCA_AUTH_COOKIE_PATH}" in header
                for header in cookie_headers
            )
        )
