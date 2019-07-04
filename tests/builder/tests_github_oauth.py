import unittest

import responses
from flask_testing import TestCase

from webapp.app import create_app
from webapp.models.user import User

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
        expected_location = "/account/details"
        response = self.client.get("/build/auth/verify")

        with self.client.session_transaction() as session:
            category, flash = session["_flashes"][0]
            self.assertEqual("negative", category)
            self.assertEqual(
                "Returned secret does not match generated secret.", flash
            )

        self.assertRedirects(response, expected_location)

    @responses.activate
    def test_failed_exchange_bad_json(self):
        expected_location = "/account/details"

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
        expected_location = "/account/details"

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
        expected_location = "/account/details"

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
    @unittest.mock.patch("webapp.builder.views.db")
    def test_successful_exchange(self, db):
        expected_location = "/account/details"

        with self.client.session_transaction() as session:
            session["github_auth_secret"] = "test"

        responses.add(
            responses.POST,
            "https://github.com/login/oauth/access_token",
            json={"access_token": "test_token"},
            status=200,
        )

        responses.add(
            responses.GET,
            "https://api.github.com/user",
            json={"name": "Test", "login": "test"},
            status=200,
        )

        with self.client.session_transaction() as session:
            session["openid"] = {"email": "test@test.test"}

        # No user in the database
        db.query().filter().first.return_value = None

        response = self.client.get("/build/auth/verify?state=test")

        db.query.assert_called_with(User)

        db.add.assert_called_once()
        user = db.add.call_args[0][0]
        self.assertEqual(user.email, "test@test.test")
        self.assertEqual(user.github_name, "Test")
        self.assertEqual(user.github_username, "test")
        self.assertEqual(user.github_token, "test_token")

        db.commit.assert_called_once()

        with self.client.session_transaction() as session:
            category, flash = session["_flashes"][0]
            self.assertEqual("positive", category)
            self.assertEqual("GitHub account connected.", flash)

        self.assertRedirects(response, expected_location)
