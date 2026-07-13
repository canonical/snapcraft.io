import responses
from urllib.parse import urlencode
from flask_testing import TestCase
from webapp.app import create_app
from cache.cache_utility import redis_cache

JETBRAINS_FIND_RESPONSE = {
    "results": [
        {
            "name": "pycharm-community",
            "snap": {
                "media": [
                    {
                        "height": 400,
                        "type": "icon",
                        "url": (
                            "https://dashboard.snapcraft.io/site_media/"
                            "appmedia/2024/06/Avatar-7.png"
                        ),
                        "width": 400,
                    },
                    {
                        "height": 2095,
                        "type": "screenshot",
                        "url": (
                            "https://dashboard.snapcraft.io/site_media/"
                            "appmedia/2017/12/pycharm_com_general.png"
                        ),
                        "width": 3713,
                    },
                ],
                "publisher": {
                    "display-name": "jetbrains",
                    "id": "28zEonXNoBLvIB7xneRbltOsp0Nf7DwS",
                    "username": "jetbrains",
                    "validation": "verified",
                },
                "summary": "PyCharm Community Edition",
                "title": "pycharm-community",
            },
            "snap-id": "Qo9GiW9eyzgN1tXmWpQ9gdstdFsj4K7E",
        },
    ]
}

LUKEWH_FIND_RESPONSE = {
    "results": [
        {
            "name": "deluge-lukewh",
            "snap": {
                "media": [
                    {
                        "height": 300,
                        "type": "icon",
                        "url": (
                            "https://dashboard.snapcraft.io/site_media/"
                            "appmedia/2020/04/the-new-deluge-icon-300x300.png"
                        ),
                        "width": 300,
                    },
                    {
                        "height": 720,
                        "type": "banner",
                        "url": (
                            "https://dashboard.snapcraft.io/site_media/"
                            "appmedia/2020/05/deluge-banner1.png"
                        ),
                        "width": 2160,
                    },
                ],
                "publisher": {
                    "display-name": "LukeWH",
                    "id": "GMrEEEdGN4gN9BhRHjRRDCoJuUkyJJnm",
                    "username": "lukewh",
                    "validation": "unproven",
                },
                "summary": (
                    "Deluge is a fully-featured cross-platform "
                    "BitTorrent client"
                ),
                "title": "Deluge",
            },
            "snap-id": "5dm2RBhIIGdr8sAnA9WJZWco2MQgbni7",
        },
    ]
}


def _snap_result(name, title):
    return {
        "name": name,
        "snap": {
            "media": [
                {
                    "height": 256,
                    "type": "icon",
                    "url": (
                        "https://dashboard.snapcraft.io/site_media/"
                        "appmedia/" + name + ".png"
                    ),
                    "width": 256,
                }
            ],
            "publisher": {
                "display-name": "Snapcrafters",
                "id": "snapcrafters-id",
                "username": "snapcrafters",
                "validation": "starred",
            },
            "summary": title + " summary",
            "title": title,
        },
        "snap-id": name + "-id",
    }


SNAPCRAFTERS_FIND_RESPONSE = {
    "results": [
        _snap_result("sublime-text", "Sublime Text"),
        _snap_result("discord", "Discord"),
        _snap_result("alacritty", "Alacritty"),
    ]
}


class GetPublisherPageTest(TestCase):
    def setUp(self):
        redis_cache.fallback.clear()
        self.api_url_publisher_items = "".join(
            [
                "https://api.snapcraft.io/api/v1/",
                "snaps/search",
                "?",
                urlencode(
                    {
                        "q": "publisher:28zEonXNoBLvIB7xneRbltOsp0Nf7DwS",
                        "size": "500",
                        "page": "1",
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
        self.api_url_find = lambda publisher: "".join(
            [
                "https://api.snapcraft.io/v2/",
                "snaps/find",
                "?",
                urlencode(
                    {
                        "publisher": publisher,
                        "fields": ",".join(
                            [
                                "title",
                                "summary",
                                "media",
                                "publisher",
                            ]
                        ),
                    }
                ),
            ]
        )

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []

        return app

    @responses.activate
    def test_community_publisher(self):
        responses.add(
            responses.GET,
            self.api_url_find("lukewh"),
            json=LUKEWH_FIND_RESPONSE,
            status=200,
        )
        response = self.client.get("/publisher/lukewh")
        self.assertEqual(response.status_code, 200)
        self.assert_template_used("store/community-publisher-details.html")

    @responses.activate
    def test_existant_publisher(self):
        responses.add(
            responses.GET,
            self.api_url_find("jetbrains"),
            json=JETBRAINS_FIND_RESPONSE,
            status=200,
        )
        response = self.client.get("/publisher/jetbrains")
        self.assertEqual(response.status_code, 200)
        self.assert_template_used("store/publisher-details.html")

    @responses.activate
    def test_non_existant_publisher(self):
        responses.add(
            responses.GET,
            self.api_url_find("toto"),
            json={"results": []},
            status=200,
        )
        response = self.client.get("/publisher/toto")
        self.assertEqual(response.status_code, 200)
        self.assert_template_used("store/community-publisher-details.html")

    @responses.activate
    def test_api_error(self):
        responses.add(
            responses.GET, self.api_url_find("jetbrains"), json={}, status=504
        )
        response = self.client.get("/publisher/jetbrains")
        self.assertEqual(response.status_code, 200)
        self.assert_template_used("store/publisher-details.html")

    @responses.activate
    def test_no_snaps_from_api(self):
        responses.add(
            responses.GET,
            self.api_url_find("jetbrains"),
            json={"results": []},
            status=200,
        )
        response = self.client.get("/publisher/jetbrains")
        self.assertEqual(response.status_code, 200)
        self.assert_template_used("store/publisher-details.html")

    @responses.activate
    def test_featured_snaps_hydrated_from_api(self):
        # jetbrains.yaml features "intellij-idea" and "pycharm". The API
        # returns intellij-idea (listed) but not pycharm (unlisted/gone).
        find_response = {
            "results": [
                _snap_result("intellij-idea", "IntelliJ IDEA"),
                _snap_result("goland", "GoLand"),
            ]
        }
        responses.add(
            responses.GET,
            self.api_url_find("jetbrains"),
            json=find_response,
            status=200,
        )
        response = self.client.get("/publisher/jetbrains")
        self.assertEqual(response.status_code, 200)

        featured = self.get_context_variable("featured_snaps")
        names = [snap["package_name"] for snap in featured]
        # pycharm is not in the API response, so it is dropped.
        self.assertEqual(names, ["intellij-idea"])

        snap = featured[0]
        # title/summary/icon come from the API
        self.assertEqual(snap["title"], "IntelliJ IDEA")
        self.assertEqual(snap["summary"], "IntelliJ IDEA summary")
        self.assertTrue(snap["icon_url"])
        # background/description come from the YAML.
        self.assertEqual(snap["background"], "#000000")
        self.assertIn("IntelliJ IDEA", snap["description"])

    @responses.activate
    def test_popular_snaps_hydrated_from_api(self):
        responses.add(
            responses.GET,
            self.api_url_find("snapcrafters"),
            json=SNAPCRAFTERS_FIND_RESPONSE,
            status=200,
        )
        response = self.client.get("/publisher/snapcrafters")
        self.assertEqual(response.status_code, 200)
        self.assert_template_used("store/publisher-details.html")

        body = response.get_data(as_text=True)
        # make sure we render only the snaps listed in snapcrafters-snaps.yaml
        self.assertIn('href="/sublime-text"', body)
        self.assertIn('href="/discord"', body)
        self.assertNotIn('href="/eclipse"', body)
        self.assertNotIn('href="/alacritty"', body)
