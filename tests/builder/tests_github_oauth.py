import unittest

import responses
from flask_testing import TestCase

from webapp.app import create_app

# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class BuilderGithubAuth(TestCase):
    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        return app

    @unittest.mock.patch("secrets.token_urlsafe")
    def test_authenticate(self, token_urlsafe):
        token_urlsafe.return_value = "test"
        response = self.client.get("/build/auth/authenticate")

        expected_location = "".join(
            [
                "https://github.com/login/oauth/authorize?",
                "client_id=None",
                "&redirect_uri=http%3A%2F%2Flocalhost%2Fbuild%2Fauth%2Fverify"
                "&scope=write%3Arepo_hook+read%3Aorg",
                "&state=test",
                "&allow_signup=True",
            ]
        )

        self.assertRedirects(response, expected_location)

    @responses.activate
    def test_verify_fails_bad_secret(self):
        response = self.client.get("/build/auth/verify")
        expected_location = "build/"

        with self.client.session_transaction() as session:
            category, flash = session["_flashes"][0]
            self.assertEqual("negative", category)
            self.assertEqual(
                "Returned secret does not match generated secret.", flash
            )

        self.assertRedirects(response, expected_location)

    @responses.activate
    def test_failed_exchange_bad_json(self):
        expected_location = "build/"

        # Set a test auth secret in session
        with self.client.session_transaction() as session:
            session["github_auth_secret"] = "test"

        responses.add(
            responses.POST,
            "https://github.com/login/oauth/access_token",
            body="bad bad json",
            status=200,
        )

        response = self.client.get("/build/auth/verify?state=test")

        with self.client.session_transaction() as session:
            category, flash = session["_flashes"][0]
            self.assertEqual("negative", category)
            self.assertEqual("Authentication token exchange failed.", flash)

        self.assertRedirects(response, expected_location)

    @responses.activate
    def test_failed_exchange_not_ok(self):
        expected_location = "build/"

        # Set a test auth secret in session
        with self.client.session_transaction() as session:
            session["github_auth_secret"] = "test"

        responses.add(
            responses.POST,
            "https://github.com/login/oauth/access_token",
            json={},
            status=500,
        )

        response = self.client.get("/build/auth/verify?state=test")

        with self.client.session_transaction() as session:
            category, flash = session["_flashes"][0]
            self.assertEqual("negative", category)
            self.assertEqual("Authentication token exchange failed.", flash)

        self.assertRedirects(response, expected_location)

    @responses.activate
    def test_failed_exchange_no_access_token(self):
        expected_location = "build/"

        # Set a test auth secret in session
        with self.client.session_transaction() as session:
            session["github_auth_secret"] = "test"

        responses.add(
            responses.POST,
            "https://github.com/login/oauth/access_token",
            json={},
            status=200,
        )

        response = self.client.get("/build/auth/verify?state=test")

        with self.client.session_transaction() as session:
            category, flash = session["_flashes"][0]
            self.assertEqual("negative", category)
            self.assertEqual("Authentication token exchange failed.", flash)

        self.assertRedirects(response, expected_location)

    @responses.activate
    def test_successful_exchange(self):
        expected_location = "build/"

        with self.client.session_transaction() as session:
            session["github_auth_secret"] = "test"

        responses.add(
            responses.POST,
            "https://github.com/login/oauth/access_token",
            json={"access_token": "test_token"},
            status=200,
        )

        response = self.client.get("/build/auth/verify?state=test")

        with self.client.session_transaction() as session:
            category, flash = session["_flashes"][0]
            self.assertEqual("positive", category)
            self.assertEqual("Authenticated with GitHub.", flash)

            self.assertEqual(True, session["github_auth"])
            self.assertEqual("test_token", session["github_token"])

        self.assertRedirects(response, expected_location)
