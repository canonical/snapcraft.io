import responses
import requests

from webapp.app import create_snapcraft
from flask_testing import TestCase


# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class BlogPage(TestCase):

    render_templates = False

    def create_app(self):
        app = create_snapcraft(testing=True)
        app.testing = True

        return app

    @responses.activate
    def test_index(self):
        url = (
            'https://admin.insights.ubuntu.com/wp-json/wp/v2'
            '/posts?tag=2080'
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
            '/posts?tag=2080'
        )

        responses.add(
            responses.GET, url,
            body=requests.exceptions.Timeout(),
            status=504)

        response = self.client.get("/blog")

        assert response.status_code == 502

    @responses.activate
    def test_article(self):
        url = (
            'https://admin.insights.ubuntu.com/wp-json/wp/v2/'
            'posts?slug=test-page&tags=2080'
        )

        payload = [
            {
                'post': 'this is a post'
            }
        ]

        responses.add(
            responses.GET, url,
            json=payload, status=200)

        response = self.client.get("/blog/test-page")

        assert response.status_code == 200
        self.assert_template_used('blog/post.html')
        self.assert_context('post', payload[0])

    @responses.activate
    def test_timeout_article(self):
        url = (
            'https://admin.insights.ubuntu.com/wp-json/wp/v2/'
            'posts?slug=test-page&tags=2080'
        )

        responses.add(
            responses.GET, url,
            body=requests.exceptions.Timeout(),
            status=504)

        response = self.client.get("/blog/test-page")

        assert response.status_code == 502

    @responses.activate
    def test_no_article(self):
        url = (
            'https://admin.insights.ubuntu.com/wp-json/wp/v2/'
            'posts?slug=test-page&tags=2080'
        )

        responses.add(
            responses.GET, url,
            json=[], status=200)

        response = self.client.get("/blog/test-page")

        assert response.status_code == 404
        self.assert_template_used('404.html')
