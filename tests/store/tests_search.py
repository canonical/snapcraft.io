import responses
from flask_testing import TestCase
from webapp.app import create_app


class GetSearchViewTest(TestCase):
    render_templates = False

    def setUp(self):
        self.categories_api_url = (
            "https://api.snapcraft.io/api/v1/snaps/sections"
        )
        self.search_snap_api_url = "".join(
            [
                "https://api.snapcraft.io/api/v1/",
                "snaps/search",
                "?q={snap_name}&page={page}&size={size}&scope=wide&arch=wide",
                "&confinement=strict,classic",
                "&fields=package_name,title,summary,icon_url,publisher,",
                "developer_validation,origin",
            ]
        )

        self.endpoint_url = "/search?q={q}&category={category}"

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []

        return app

    def test_no_search_q(self):
        endpoint = self.endpoint_url.format(q="", category="")
        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, 302)
        self.assertEqual("http://localhost/store", response.location)

    @responses.activate
    def test_search_q_no_results(self):
        responses.add(
            responses.Response(
                method="GET", url=self.categories_api_url, json={}, status=200
            )
        )

        payload = {"_embedded": {"clickindex:package": {}}, "total": 0}

        search_api_formated = self.search_snap_api_url.format(
            snap_name="snap", page="1", size="25"
        )
        responses.add(
            responses.Response(
                method="GET", url=search_api_formated, json=payload, status=200
            )
        )

        endpoint = self.endpoint_url.format(q="snap", category="")
        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, 200)

        self.assert_context("query", "snap")
        self.assert_context("category", "")
        self.assert_context("category_display", None)
        self.assert_context("categories", [])
        self.assert_context("snaps", {})
        self.assert_context("total", 0)
        self.assert_context("links", {})
        self.assert_context("error_info", {})

    @responses.activate
    def test_search_q_with_zero_as_page(self):
        responses.add(
            responses.Response(
                method="GET", url=self.categories_api_url, json={}, status=200
            )
        )

        payload = {"_embedded": {"clickindex:package": {}}, "total": 0}

        search_api_formated = self.search_snap_api_url.format(
            snap_name="snap", page="1", size="25"
        )
        responses.add(
            responses.Response(
                method="GET", url=search_api_formated, json=payload, status=200
            )
        )

        endpoint = self.endpoint_url.format(q="snap", category="")
        endpoint = endpoint + "&offset=1&limit=0"
        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, 200)

        self.assert_context("query", "snap")
        self.assert_context("category", "")
        self.assert_context("category_display", None)
        self.assert_context("categories", [])
        self.assert_context("snaps", {})
        self.assert_context("total", 0)
        self.assert_context("links", {})
        self.assert_context("error_info", {})

    @responses.activate
    def test_search_q_with_results(self):
        responses.add(
            responses.Response(
                method="GET", url=self.categories_api_url, json={}, status=200
            )
        )

        payload = {
            "_embedded": {
                "clickindex:package": [
                    {"package_name": "toto"},
                    {"package_name": "tata"},
                    {"package_name": "tutu"},
                ]
            },
            "total": 3,
            "_links": {
                "last": {"href": "http://url.c?q=snap&size=1&page=1"},
                "next": {"href": "http://url.c?q=snap&size=1&page=1"},
                "self": {"href": "http://url.c?q=snap&size=1&page=1"},
            },
        }

        search_api_formated = self.search_snap_api_url.format(
            snap_name="snap", page="1", size="25"
        )
        responses.add(
            responses.Response(
                method="GET", url=search_api_formated, json=payload, status=200
            )
        )

        endpoint = self.endpoint_url.format(q="snap", category="")
        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, 200)

        self.assert_context("query", "snap")
        self.assert_context("category", "")
        self.assert_context("category_display", None)
        self.assert_context("categories", [])
        self.assert_context(
            "snaps",
            [
                {"package_name": "toto"},
                {"package_name": "tata"},
                {"package_name": "tutu"},
            ],
        )
        self.assert_context("total", 3)
        self.assert_context(
            "links",
            {
                "last": "http://localhost/search?q=snap&limit=1&offset=0",
                "next": "http://localhost/search?q=snap&limit=1&offset=0",
                "self": "http://localhost/search?q=snap&limit=1&offset=0",
            },
        )

        self.assert_context("error_info", {})
