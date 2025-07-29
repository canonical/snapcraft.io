import unittest
import os
import hashlib

from webapp import helpers
from webapp.app import create_app
from flask_testing import TestCase


class GetDnsVerificationTokenTest(unittest.TestCase):
    def test_get_dns_verification_token(self):
        salt = os.getenv("DNS_VERIFICATION_SALT")
        token_string = f"spotify.com:spotify:{salt}"
        test_hash = hashlib.sha256(token_string.encode("utf-8")).hexdigest()
        self.assertEqual(
            helpers.get_dns_verification_token("spotify", "spotify.com"),
            test_hash,
        )


class DirectoryExists(TestCase):
    def create_app(self):
        app = create_app(testing=True)
        return app

    def test_directory_exists(self):
        filename = "first_snap/content/c"
        self.assertTrue(helpers.directory_exists(filename))

    def test_directory_not_exists(self):
        filename = "first_snap/content/test"
        self.assertFalse(helpers.directory_exists(filename))
