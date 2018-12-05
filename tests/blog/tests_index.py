import requests

import responses
from flask_testing import TestCase
from webapp import api
from webapp.app import create_app

# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class BlogPage(TestCase):

    render_templates = False

    def create_app(self):
        app = create_app(testing=True)
        app.config["BLOG_CATEGORIES_ENABLED"] = "true"
        app.secret_key = "secret_key"

        return app

    def setUp(self):
        api.blog.api_session = api.requests.Session()
        self.api_url = "https://admin.insights.ubuntu.com/wp-json/wp/v2"

    @responses.activate
    def test_index(self):
        posts_url = "".join([self.api_url, "/posts?tag=2065"])

        payload = [
            {
                "featured_media": 123,
                "date_gmt": "2018-06-11T11:11:11",
                "author": 321,
                "categories": [123],
            }
        ]

        posts_headers = {"X-WP-TotalPages": "1"}

        responses.add(
            responses.GET,
            posts_url,
            json=payload,
            status=200,
            headers=posts_headers,
        )

        categories_url = "".join([self.api_url, "/categories?per_page=100"])

        categories_payload = [{"name": "Articles"}]

        responses.add(
            responses.GET, categories_url, json=categories_payload, status=200
        )

        # See webapp/blog/views.py:22
        # media_url = "".join([self.api_url, "/media/123"])
        #
        # responses.add(responses.GET, media_url, json={}, status=200)

        response = self.client.get("/blog")

        assert response.status_code == 200
        self.assert_template_used("blog/index.html")
        self.assert_context(
            "articles",
            [
                {
                    "date": "11 June 2018",
                    "date_gmt": "2018-06-11T11:11:11",
                    "featured_media": 123,
                    "image": None,
                    "author": None,
                    "categories": [123],
                }
            ],
        )

    @responses.activate
    def test_posts_timeout(self):
        url = "".join([self.api_url, "/posts?tag=2065"])

        headers = {"X-WP-TotalPages": "1"}

        responses.add(
            responses.GET,
            url,
            body=requests.exceptions.Timeout(),
            status=504,
            headers=headers,
        )

        categories_url = "".join([self.api_url, "/categories?per_page=100"])

        categories_payload = [{"name": "Articles"}]

        responses.add(
            responses.GET, categories_url, json=categories_payload, status=200
        )

        response = self.client.get("/blog")

        assert response.status_code == 502

    # See webapp/blog/views.py:22
    # @responses.activate
    # def test_media_timeout(self):
    #     posts_url = "".join([self.api_url, "/posts?tag=2065"])
    #
    #     payload = [
    #         {
    #             "featured_media": 123,
    #             "date_gmt": "2018-06-11T11:11:11",
    #             "author": 321,
    #         }
    #     ]
    #
    #     posts_headers = {"X-WP-TotalPages": "1"}
    #
    #     responses.add(
    #         responses.GET,
    #         posts_url,
    #         json=payload,
    #         status=200,
    #         headers=posts_headers,
    #     )
    #
    #     url = "".join([self.api_url, "/media/123"])
    #
    #     responses.add(
    #         responses.GET, url, body=requests.exceptions.Timeout(),
    #         status=504
    #     )
    #
    #     response = self.client.get("/blog")
    #
    #     assert response.status_code == 200
    #     self.assert_template_used("blog/index.html")
    #     self.assert_context(
    #         "articles",
    #         [
    #             {
    #                 "date": "11 June 2018",
    #                 "date_gmt": "2018-06-11T11:11:11",
    #                 "featured_media": 123,
    #                 "image": None,
    #                 "author": None,
    #             }
    #         ],
    #     )

    @responses.activate
    def test_user_timeout(self):
        posts_url = "".join([self.api_url, "/posts?tag=2065"])

        payload = [
            {
                "featured_media": 123,
                "date_gmt": "2018-06-11T11:11:11",
                "author": 321,
                "categories": [123],
            }
        ]

        posts_headers = {"X-WP-TotalPages": "1"}

        responses.add(
            responses.GET,
            posts_url,
            json=payload,
            status=200,
            headers=posts_headers,
        )

        url = "".join([self.api_url, "/users/321"])

        responses.add(
            responses.GET, url, body=requests.exceptions.Timeout(), status=504
        )

        categories_url = "".join([self.api_url, "/categories?per_page=100"])

        categories_payload = [{"name": "Articles"}]

        responses.add(
            responses.GET, categories_url, json=categories_payload, status=200
        )

        response = self.client.get("/blog")

        assert response.status_code == 200
        self.assert_template_used("blog/index.html")
        self.assert_context(
            "articles",
            [
                {
                    "date": "11 June 2018",
                    "date_gmt": "2018-06-11T11:11:11",
                    "featured_media": 123,
                    "image": None,
                    "author": None,
                    "categories": [123],
                }
            ],
        )

    @responses.activate
    def test_article(self):
        url = (
            "https://admin.insights.ubuntu.com/wp-json/wp/v2/"
            "posts?slug=test-page&tags=2065"
        )

        payload = [
            {
                "author": 321,
                "tags": [10],
                "id": 20,
                "content": {"rendered": "test"},
            }
        ]

        responses.add(responses.GET, url, json=payload, status=200)

        response = self.client.get("/blog/test-page")

        assert response.status_code == 200
        self.assert_template_used("blog/article.html")
        self.assert_context(
            "article",
            {
                "author": None,
                "image": None,
                "id": 20,
                "tags": [10],
                "content": {"rendered": "test"},
            },
        )

    @responses.activate
    def test_timeout_article(self):
        url = (
            "https://admin.insights.ubuntu.com/wp-json/wp/v2/"
            "posts?slug=test-page&tags=2065"
        )

        responses.add(
            responses.GET, url, body=requests.exceptions.Timeout(), status=504
        )

        response = self.client.get("/blog/test-page")

        assert response.status_code == 502

    @responses.activate
    def test_no_article(self):
        url = (
            "https://admin.insights.ubuntu.com/wp-json/wp/v2/"
            "posts?slug=test-page&tags=2080"
        )

        responses.add(responses.GET, url, json=[], status=200)

        response = self.client.get("/blog/test-page")

        assert response.status_code == 404
        self.assert_template_used("404.html")

    @responses.activate
    def test_related_posts_timeout(self):
        posts_url = "".join([self.api_url, "/posts?slug=test-page&tags=2065"])

        payload = [{"author": 321, "tags": [2065], "id": 20}]

        posts_headers = {"X-WP-TotalPages": "1"}

        responses.add(
            responses.GET,
            posts_url,
            json=payload,
            status=200,
            headers=posts_headers,
        )

        url = "".join(
            [self.api_url, "/posts?tags=2065&per_page=3&page=1&exclude=10"]
        )

        responses.add(
            responses.GET, url, body=requests.exceptions.Timeout(), status=504
        )

        response = self.client.get("/blog/test-page")

        assert response.status_code == 200
        self.assert_template_used("blog/article.html")
        self.assert_context(
            "article",
            {"author": None, "image": None, "id": 20, "tags": [2065]},
        )

    @responses.activate
    def test_get_feed(self):
        url = "https://admin.insights.ubuntu.com/?tag=Snap&feed=rss"

        responses.add(responses.GET, url, body="xml", status=200)

        response = self.client.get("/blog/feed")

        assert response.status_code == 200
        self.assertEqual(response.data, b"xml")

    @responses.activate
    def test_timeout_get_feed(self):
        url = "https://admin.insights.ubuntu.com/?tag=Snap&feed=rss"

        responses.add(
            responses.GET, url, body=requests.exceptions.Timeout(), status=504
        )

        response = self.client.get("/blog/feed")

        assert response.status_code == 502

    def test_article_redirects(self):
        """
        Check that blog articles can be requested with
        year, month and day parts in the URL, which will
        result in a redirect to the canonical URL, with just the slug
        """

        year_redirect = self.client.get("/blog/2005/article_slug")
        month_redirect = self.client.get("/blog/2005/10/article_slug")
        day_redirect = self.client.get("/blog/2005/10/31/article_slug")

        assert year_redirect.status_code == 302
        assert month_redirect.status_code == 302
        assert day_redirect.status_code == 302

        assert (
            year_redirect.headers.get("Location")
            == "http://localhost/blog/article_slug"
        )
        assert (
            month_redirect.headers.get("Location")
            == "http://localhost/blog/article_slug"
        )
        assert (
            day_redirect.headers.get("Location")
            == "http://localhost/blog/article_slug"
        )
