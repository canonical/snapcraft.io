import copy
from urllib.parse import urlencode

import responses
from cache.cache_utility import redis_cache
from flask_testing import TestCase

from webapp.app import create_app

JETBRAINS_PUBLISHER = {
    "display-name": "JetBrains",
    "id": "28zEonXNoBLvIB7xneRbltOsp0Nf7DwS",
    "username": "jetbrains",
    "validation": "verified",
}


def _publisher(username, display_name, validation):
    return {
        "display-name": display_name,
        "id": f"{username}-id",
        "username": username,
        "validation": validation,
    }


def _snap_result(name, title, publisher):
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
            "publisher": publisher,
            "summary": title + " summary",
            "title": title,
        },
        "snap-id": name + "-id",
    }


JETBRAINS_FIND_RESPONSE = {
    "results": [
        _snap_result(
            "pycharm-community",
            "PyCharm Community",
            JETBRAINS_PUBLISHER,
        )
    ]
}

LUKEWH_FIND_RESPONSE = {
    "results": [
        _snap_result(
            "deluge-lukewh",
            "Deluge",
            _publisher("lukewh", "LukeWH", "unproven"),
        )
    ]
}

SNAPCRAFTERS_FIND_RESPONSE = {
    "results": [
        _snap_result(
            "sublime-text",
            "Sublime Text",
            _publisher("snapcrafters", "Snapcrafters", "starred"),
        ),
        _snap_result(
            "discord",
            "Discord",
            _publisher("snapcrafters", "Snapcrafters", "starred"),
        ),
        _snap_result(
            "alacritty",
            "Alacritty",
            _publisher("snapcrafters", "Snapcrafters", "starred"),
        ),
    ]
}


class GetPublisherPageTest(TestCase):
    def setUp(self):
        redis_cache.fallback.clear()
        self.api_url_find = lambda publisher: "".join(
            [
                "https://api.snapcraft.io/v2/",
                "snaps/find",
                "?",
                urlencode(
                    {
                        "q": "",
                        "fields": ",".join(
                            [
                                "title",
                                "summary",
                                "media",
                                "publisher",
                            ]
                        ),
                        "publisher": publisher,
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
    def test_existing_custom_publisher(self):
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

    def test_snap_quarantine_is_not_public(self):
        response = self.client.get("/publisher/snap-quarantine")
        self.assertEqual(response.status_code, 404)

    @responses.activate
    def test_api_error_on_custom_page_still_renders(self):
        responses.add(
            responses.GET,
            self.api_url_find("jetbrains"),
            json={},
            status=504,
        )

        response = self.client.get("/publisher/jetbrains")
        self.assertEqual(response.status_code, 200)
        self.assert_template_used("store/publisher-details.html")

    @responses.activate
    def test_no_snaps_from_api_for_custom_page(self):
        responses.add(
            responses.GET,
            self.api_url_find("jetbrains"),
            json={"results": []},
            status=200,
        )

        response = self.client.get("/publisher/jetbrains")
        self.assertEqual(response.status_code, 200)
        self.assert_template_used("store/publisher-details.html")

        body = response.get_data(as_text=True)
        self.assertNotIn("Verified account", body)

    @responses.activate
    def test_featured_snaps_hydrated_from_api(self):
        # jetbrains.yaml features "intellij-idea" and "pycharm".
        # The API returns intellij-idea (listed) but not pycharm.
        find_response = {
            "results": [
                _snap_result(
                    "intellij-idea",
                    "IntelliJ IDEA",
                    JETBRAINS_PUBLISHER,
                ),
                _snap_result("goland", "GoLand", JETBRAINS_PUBLISHER),
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
        self.assertEqual(names, ["intellij-idea"])

        snap = featured[0]
        self.assertEqual(snap["title"], "IntelliJ IDEA")
        self.assertEqual(snap["summary"], "IntelliJ IDEA summary")
        self.assertTrue(snap["icon_url"])
        self.assertEqual(snap["background"], "#000000")
        self.assertIn("IntelliJ IDEA", snap["description"])

    @responses.activate
    def test_listed_snaps_hydrated_from_api(self):
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

        # Snaps not listed in snapcrafters.yaml are omitted.
        self.assertIn('href="/sublime-text"', body)
        self.assertIn('href="/discord"', body)
        self.assertNotIn('href="/alacritty"', body)

        # the curated layout includes the "See all snaps" link
        self.assertIn(
            "See all snaps published by Snapcrafters",
            body,
        )

    @responses.activate
    def test_custom_registry_is_not_mutated_by_requests(self):
        responses.add(
            responses.GET,
            self.api_url_find("jetbrains"),
            json=JETBRAINS_FIND_RESPONSE,
            status=200,
        )

        registry_before = copy.deepcopy(
            self.app.extensions["publisher_pages_registry"]
        )

        self.client.get("/publisher/jetbrains")
        self.client.get("/publisher/jetbrains")
        self.client.get("/publisher/jetbrains")

        self.assertEqual(
            registry_before,
            self.app.extensions["publisher_pages_registry"],
        )
