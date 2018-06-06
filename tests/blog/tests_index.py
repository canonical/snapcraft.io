import unittest

import responses

from webapp.app import app
from flask_testing import TestCase


# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class BlogPage(TestCase):

    render_templates = False

    def create_app(self):
        my_app = app
        my_app.testing = True

        return my_app

    @responses.activate
    def test_index(self):
        response = self.client.get("/blog")

        assert response.status_code == 200
        self.assert_template_used('blog/index.html')


if __name__ == '__main__':
    unittest.main()
