import responses
import requests

from webapp.app import create_app
from flask_testing import TestCase


# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class BlogPage(TestCase):

    render_templates = False

    def create_app(self):
        app = create_app(testing=True)

        return app

    def setUp(self):
        self.api_url = 'https://admin.insights.ubuntu.com/wp-json/wp/v2'

    @responses.activate
    def test_index(self):
        posts_url = ''.join([
            self.api_url,
            '/posts?tag=2065'])

        payload = [
            {
                'featured_media': 123,
                'date_gmt': '2018-06-11T11:11:11'
            }
        ]

        posts_headers = {
            'X-WP-TotalPages': '1'
        }

        responses.add(
            responses.GET, posts_url,
            json=payload, status=200, headers=posts_headers)

        media_url = ''.join([
            self.api_url,
            '/media/123'])

        responses.add(
            responses.GET, media_url,
            json={}, status=200)

        response = self.client.get("/blog")

        assert response.status_code == 200
        self.assert_template_used('blog/index.html')
        self.assert_context('articles', [{
            'date': '11 June 2018',
            'date_gmt': '2018-06-11T11:11:11',
            'featured_media': 123,
            'image': {}
        }])

    @responses.activate
    def test_posts_timeout(self):
        url = ''.join([
            self.api_url,
            '/posts?tag=2065'])

        headers = {
            'X-WP-TotalPages': '1'
        }

        responses.add(
            responses.GET, url,
            body=requests.exceptions.Timeout(),
            status=504,
            headers=headers)

        response = self.client.get("/blog")

        assert response.status_code == 502

    @responses.activate
    def test_media_timeout(self):
        posts_url = ''.join([
            self.api_url,
            '/posts?tag=2065'])

        payload = [
            {
                'featured_media': 123,
                'date_gmt': '2018-06-11T11:11:11'
            }
        ]

        posts_headers = {
            'X-WP-TotalPages': '1'
        }

        responses.add(
            responses.GET, posts_url,
            json=payload, status=200, headers=posts_headers)

        url = ''.join([
            self.api_url,
            '/media/123'])

        responses.add(
            responses.GET, url,
            body=requests.exceptions.Timeout(),
            status=504)

        response = self.client.get("/blog")

        assert response.status_code == 200
        self.assert_template_used('blog/index.html')
        self.assert_context('articles', [{
            'date': '11 June 2018',
            'date_gmt': '2018-06-11T11:11:11',
            'featured_media': 123,
            'image': None
        }])

    @responses.activate
    def test_article(self):
        url = (
            'https://admin.insights.ubuntu.com/wp-json/wp/v2/'
            'posts?slug=test-page&tags=2065'
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
            'posts?slug=test-page&tags=2065'
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
