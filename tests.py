#! /usr/bin/env python3

import os
import app
import unittest

class WebAppTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.app.test_client()
        self.app.testing = True

    def test_no_homepage(self):
        homepage_request = self.app.get('/')
        assert homepage_request.status_code == 404

if __name__ == '__main__':
    unittest.main()

