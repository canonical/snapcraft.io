#! /usr/bin/env python3

import app
import unittest


class WebAppTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.app.test_client()
        self.app.testing = True

    def test_no_homepage(self):
        response = self.app.get('/')
        assert response.status_code == 404
        assert "Page not found" in str(response.data)

    def test_redirect_to_add_slash(self):
        response = self.app.get('/canonical-livepatch')
        location = response.headers.get('Location')

        assert response.status_code in (301,302)
        assert location == "http://localhost/canonical-livepatch/"

    def test_canonical_livepatch_snap(self):
        response = self.app.get('/canonical-livepatch/')

        assert response.status_code == 200

    def test_non_existent_snap(self):
        response = self.app.get('/non-existent-snap/')

        assert response.status_code == 404
        assert "Snap not found" in str(response.data)



if __name__ == '__main__':
    unittest.main()
