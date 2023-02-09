import responses
from urllib.parse import urlencode
from flask_testing import TestCase
from webapp.app import create_app


class GetSearchViewTest(TestCase):
    render_templates = False

    def setUp(self):
        self.categories_api_url = (
            "https://api.snapcraft.io/v2/snaps/categories?type=shared"
        )
        self.search_snap_api_url = "".join(
            [
                "https://api.snapcraft.io/api/v1/",
                "snaps/search",
                "?",
                "q={snap_name}&",
                "size={size}&",
                "page={page}&",
                urlencode(
                    {
                        "scope": "wide",
                        "confinement": "strict,classic",
                        "fields": ",".join(
                            [
                                "package_name",
                                "title",
                                "summary",
                                "architecture",
                                "media",
                                "developer_name",
                                "developer_id",
                                "developer_validation",
                                "origin",
                                "apps",
                                "sections",
                            ]
                        ),
                        "arch": "wide",
                    }
                ),
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
        payload = {"_embedded": {"clickindex:package": []}, "total": 0}

        search_api_formated = self.search_snap_api_url.format(
            snap_name="snap", page="1", size="44"
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
        self.assert_context("searched_snaps", [])
        self.assert_context("featured_snaps", [])
        self.assert_context("total", 0)
        self.assert_context("links", {"next": "/search?q=snap&page=2"})

    @responses.activate
    def test_search_q_with_zero_as_page(self):
        payload = {"_embedded": {"clickindex:package": []}, "total": 0}

        search_api_formated = self.search_snap_api_url.format(
            snap_name="snap", page="1", size="44"
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
        self.assert_context("featured_snaps", [])
        self.assert_context("searched_snaps", [])
        self.assert_context("total", 0)
        self.assert_context("links", {"next": "/search?q=snap&page=2"})

    @responses.activate
    def test_search_q_with_results(self):
        payload = {
            "_embedded": {
                "clickindex:package": [
                    {"package_name": "toto", "media": []},
                    {"package_name": "tata", "media": []},
                    {"package_name": "tutu", "media": []},
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
            snap_name="snap", page="1", size="44"
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
        self.assert_context("featured_snaps", [])
        self.assert_context(
            "searched_snaps",
            [
                {"package_name": "toto", "media": [], "icon_url": ""},
                {"package_name": "tata", "media": [], "icon_url": ""},
                {"package_name": "tutu", "media": [], "icon_url": ""},
            ],
        )
        self.assert_context("total", 3)
        self.assert_context("links", {})

    @responses.activate
    def test_search_q_with_results_but_no_total(self):
        payload = {
            "_embedded": {
                "clickindex:package": [
                    {"package_name": "toto", "media": []},
                    {"package_name": "tata", "media": []},
                    {"package_name": "tutu", "media": []},
                ]
            },
            "_links": {
                "last": {"href": "http://url.c?q=snap&size=1&page=1"},
                "next": {"href": "http://url.c?q=snap&size=1&page=1"},
                "self": {"href": "http://url.c?q=snap&size=1&page=1"},
            },
        }

        search_api_formated = self.search_snap_api_url.format(
            snap_name="snap", page="1", size="44"
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
        self.assert_context("featured_snaps", [])
        self.assert_context(
            "searched_snaps",
            [
                {"package_name": "toto", "media": [], "icon_url": ""},
                {"package_name": "tata", "media": [], "icon_url": ""},
                {"package_name": "tutu", "media": [], "icon_url": ""},
            ],
        )
        self.assert_context("total", None)
        self.assert_context("links", {"next": "/search?q=snap&page=2"})

    @responses.activate
    def test_search_q_with_category(self):
        snap_list = [
            {"package_name": "toto", "icon_url": "", "media": []},
            {
                "package_name": "tata",
                "icon_url": "tata.jpg",
                "media": [{"type": "icon", "url": "tata.jpg"}],
            },
            {
                "package_name": "tutu",
                "icon_url": "tutu.jpg",
                "media": [{"type": "icon", "url": "tutu.jpg"}],
            },
            {"package_name": "tete", "icon_url": "", "media": []},
        ]

        for i in range(0, 144):
            snap_list.append(
                {"package_name": "toto" + str(i), "media": [], "icon_url": ""}
            )

        payload = {
            "_embedded": {"clickindex:package": snap_list[:44]},
            "total": 144,
            "_links": {
                "last": {"href": "http://url.c?q=snap&size=1&page=1"},
                "next": {"href": "http://url.c?q=snap&size=1&page=1"},
                "self": {"href": "http://url.c?q=snap&size=1&page=1"},
            },
        }

        search_api_formated = self.search_snap_api_url.format(
            snap_name="", page="1", size="44"
        )
        search_api_formated += "&section=toto"
        responses.add(
            responses.Response(
                method="GET", url=search_api_formated, json=payload, status=200
            )
        )

        endpoint = self.endpoint_url.format(q="", category="toto")
        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, 200)

        self.assert_context("query", "")
        self.assert_context("category", "toto")
        self.assert_context("category_display", "Toto")
        self.assert_context(
            "featured_snaps", [snap_list[1], snap_list[0]] + snap_list[2:16]
        )
        self.assert_context("searched_snaps", snap_list[16:44])
        self.assert_context("page", 1)
        self.assert_context("total", 144)
        self.assert_context(
            "links",
            {
                "last": "/search?category=toto&page=4",
                "next": "/search?category=toto&page=2",
            },
        )

    @responses.activate
    def test_search_q_with_category_page_2(self):
        snap_list = [
            {"package_name": "toto", "media": []},
            {
                "package_name": "tata",
                "media": [{"type": "icon", "url": "tata.jpg"}],
            },
            {
                "package_name": "tutu",
                "media": [{"type": "icon", "url": "tutu.jpg"}],
            },
            {"package_name": "tete", "media": []},
        ]

        for i in range(0, 44):
            snap_list.append({"package_name": "toto" + str(i), "media": []})

        payload = {
            "_embedded": {"clickindex:package": snap_list},
            "total": 144,
            "_links": {
                "last": {"href": "http://url.c?q=snap&size=1&page=1"},
                "next": {"href": "http://url.c?q=snap&size=1&page=1"},
                "self": {"href": "http://url.c?q=snap&size=1&page=1"},
            },
        }

        search_api_formated = self.search_snap_api_url.format(
            snap_name="", page="2", size="44"
        )
        search_api_formated += "&section=toto"
        responses.add(
            responses.Response(
                method="GET", url=search_api_formated, json=payload, status=200
            )
        )

        endpoint = self.endpoint_url.format(q="", category="toto") + "&page=2"
        response = self.client.get(endpoint)

        snap_list_results = []
        for snap in snap_list:
            snap_list_results.append(
                {
                    "package_name": snap["package_name"],
                    "media": snap["media"],
                    "icon_url": snap["media"][0]["url"]
                    if len(snap["media"]) > 0
                    else "",
                }
            )

        self.assertEqual(response.status_code, 200)

        self.assert_context("query", "")
        self.assert_context("category", "toto")
        self.assert_context("category_display", "Toto")
        self.assert_context("featured_snaps", [])
        self.assert_context("searched_snaps", snap_list_results)
        self.assert_context("page", 2)
        self.assert_context("total", 144)
        self.assert_context(
            "links",
            {
                "first": "/search?category=toto&page=1",
                "last": "/search?category=toto&page=4",
                "next": "/search?category=toto&page=3",
                "prev": "/search?category=toto&page=1",
            },
        )

    @responses.activate
    def test_search_q_with_category_featured(self):
        snap_list = [
            {"package_name": "toto", "icon_url": "", "media": []},
            {
                "package_name": "tata",
                "icon_url": "tata.jpg",
                "media": [{"type": "icon", "url": "tata.jpg"}],
            },
            {
                "package_name": "tutu",
                "icon_url": "tutu.jpg",
                "media": [{"type": "icon", "url": "tutu.jpg"}],
            },
            {"package_name": "tete", "icon_url": "", "media": []},
        ]

        for i in range(0, 44):
            snap_list.append(
                {"package_name": "toto" + str(i), "icon_url": "", "media": []}
            )

        payload = {
            "_embedded": {"clickindex:package": snap_list},
            "total": 44,
            "_links": {
                "last": {"href": "http://url.c?q=snap&size=1&page=1"},
                "next": {"href": "http://url.c?q=snap&size=1&page=1"},
                "self": {"href": "http://url.c?q=snap&size=1&page=1"},
            },
        }

        search_api_formated = self.search_snap_api_url.format(
            snap_name="", page="1", size="44"
        )
        search_api_formated += "&section=featured"
        responses.add(
            responses.Response(
                method="GET", url=search_api_formated, json=payload, status=200
            )
        )

        endpoint = (
            self.endpoint_url.format(q="", category="featured") + "&page=1"
        )
        response = self.client.get(endpoint)

        self.assertEqual(response.status_code, 200)

        self.assert_context("query", "")
        self.assert_context("category", "featured")
        self.assert_context("category_display", "Featured")
        self.assert_context(
            "featured_snaps", [snap_list[1], snap_list[0]] + snap_list[2:]
        )
        self.assert_context("searched_snaps", [])
        self.assert_context("page", 1)
        self.assert_context("total", 44)
        self.assert_context("links", {})
