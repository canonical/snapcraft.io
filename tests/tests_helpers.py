import unittest
import os
import hashlib

from webapp import helpers


class GetDnsVerificationTokenTest(unittest.TestCase):
    def test_get_dns_verification_token(self):
        salt = os.getenv("DNS_VERIFICATION_SALT")
        token_string = f"spotify.com:spotify:{salt}"
        test_hash = hashlib.sha256(token_string.encode("utf-8")).hexdigest()
        self.assertEqual(
            helpers.get_dns_verification_token("spotify", "spotify.com"),
            test_hash,
        )
