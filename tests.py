#! /usr/bin/env python3

import app
import unittest
from urllib.parse import urlparse, urlunparse


class WebAppTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.app.test_client()
        self.app.testing = True

    # Static pages
    # ==

    def test_homepage(self):
        self._check_basic_page('/')

    def test_storefront(self):
        response = self._check_basic_page('/store')
        assert 'type="search"' in str(response.data)

    def test_search(self):
        redirect = self._get_response('/search')
        assert redirect.status_code == 302
        assert redirect.headers.get('Location') == "http://localhost/store"

        response = self._check_basic_page('/search?q=livepatch')
        assert 'type="search"' in str(response.data)
        assert 'canonical-livepatch' in str(response.data)

    def test_not_found(self):
        response = self._get_response('/store/nothing-page')

        assert response.status_code == 404
        assert "Page not found" in str(response.data)

    # Account pages
    # ===

    def test_account(self):
        """
        Naive check that the basic redirects to the authentication system
        are working for the /account page
        """

        local_redirect = self._get_response('/account')
        redirect_url = "http://localhost/login?next=/account"
        assert local_redirect.status_code == 302
        assert local_redirect.headers.get('Location') == redirect_url

        ext_redirect = self._get_response('/login?next=/account')
        ext2_redirect = self._get_response('/login?next=/account')
        assert ext_redirect.status_code == 302
        assert ext2_redirect.status_code == 302
        assert 'login.ubuntu.com' in ext_redirect.headers.get('Location')
        assert 'login.ubuntu.com' in ext2_redirect.headers.get('Location')

    # Snap details pages
    # ==

    def test_canonical_livepatch_snap(self):
        response = self._check_basic_page('/canonical-livepatch')
        assert "canonical-livepatch" in str(response.data)

    def test_lxd_snap(self):
        response = self._check_basic_page('/lxd')
        assert "LXD" in str(response.data)

    def test_non_existent_snap(self):
        response = self._get_response('/non-existent-snap')

        assert response.status_code == 404
        assert "Snap not found" in str(response.data)

    # Helper methods
    # ==

    def _get_response(self, uri):
        """
        Given a basic app path (e.g. '/page'), check that any trailing
        slashes are removed with a 302 redirect, and return the response
        for the principal URL
        """

        # Check trailing slashes trigger redirect
        parsed_uri = urlparse(uri)
        slash_uri = urlunparse(parsed_uri._replace(path=parsed_uri.path + '/'))
        redirect_response = self.app.get(slash_uri)
        assert redirect_response.status_code == 302

        url = "http://localhost" + uri
        assert redirect_response.headers.get('Location') == url

        return self.app.get(uri)

    def _check_basic_page(self, uri):
        """
        Check that a URI returns an HTML page that will redirect to remove
        slashes, returns a 200 and contains the standard footer text
        """

        if uri == '/':
            response = self.app.get(uri)
        else:
            response = self._get_response(uri)

        assert response.status_code == 200
        assert "Ubuntu and Canonical are registered" in str(response.data)

        return response


if __name__ == '__main__':
    unittest.main()
