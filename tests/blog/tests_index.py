import responses
import requests

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
        url = (
            'https://admin.insights.ubuntu.com/wp-json/wp/v2'
            '/posts?tag=snappy'
        )

        payload = {
            'articles': 'list of articles'
        }
        responses.add(
            responses.GET, url,
            json=payload, status=200)

        response = self.client.get("/blog")

        assert response.status_code == 200
        self.assert_template_used('blog/index.html')
        self.assert_context('articles', payload)

    @responses.activate
    def test_timeout(self):
        url = (
            'https://admin.insights.ubuntu.com/wp-json/wp/v2'
            '/posts?tag=snappy'
        )

        responses.add(
            responses.GET, url,
            body=requests.exceptions.Timeout(),
            status=504)

        response = self.client.get("/blog")

        assert response.status_code == 502
