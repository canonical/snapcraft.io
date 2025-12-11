import responses
from urllib.parse import urlencode
from flask_testing import TestCase
from webapp.app import create_app

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


class GetPublisherPageTest(TestCase):
    def setUp(self):
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
