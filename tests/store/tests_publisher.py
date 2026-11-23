import copy
import re
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
        {
            "name": "deluge-lukewh",
            "snap": {
                "media": [
                    {
                        "height": 256,
                        "type": "icon",
                        "url": (
                            "https://dashboard.snapcraft.io/"
                            "site_media/appmedia/2016/07/vlc.png"
                        ),
                        "width": 256,
                    }
                ],
                "publisher": _publisher("lukewh", "LukeWH", "unproven"),
                "summary": "Deluge summary",
                "title": "Deluge",
            },
            "snap-id": "deluge-lukewh-id",
        }
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

    def _set_custom_registry_entry(self, publisher_name, content):
        registry = self.app.extensions["publisher_pages_registry"]
        registry[publisher_name] = content

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
    def test_community_publisher_api_error_returns_502(self):
        responses.add(
            responses.GET,
            self.api_url_find("lukewh"),
            json={},
            status=504,
        )
        response = self.client.get("/publisher/lukewh")
        self.assertEqual(response.status_code, 502)

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
    def test_existing_custom_publishers_keep_custom_template_routes(self):
        fixtures = {
            "jetbrains": JETBRAINS_FIND_RESPONSE,
            "kde": {
                "results": [
                    _snap_result(
                        "krita",
                        "Krita",
                        _publisher("kde", "KDE", "verified"),
                    )
                ]
            },
            "snapcrafters": SNAPCRAFTERS_FIND_RESPONSE,
        }

        for publisher_name, find_response in fixtures.items():
            responses.add(
                responses.GET,
                self.api_url_find(publisher_name),
                json=find_response,
                status=200,
            )

            response = self.client.get(f"/publisher/{publisher_name}")

            self.assertEqual(response.status_code, 200)
            self.assertEqual(
                response.request.path, f"/publisher/{publisher_name}"
            )
            self.assert_template_used("store/publisher-details.html")

    @responses.activate
    def test_non_existent_publisher(self):
        responses.add(
            responses.GET,
            self.api_url_find("toto"),
            json={"results": []},
            status=200,
        )
        response = self.client.get("/publisher/toto")
        self.assertEqual(response.status_code, 200)
        self.assert_template_used("store/community-publisher-details.html")

        body = response.get_data(as_text=True)
        self.assertIn("(toto)", body)

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
        self.assertNotIn('class="p-media-object p-media-object--snap"', body)

    @responses.activate
    def test_verified_status_precedes_first_snap_for_custom_publishers(self):
        fixtures = {
            "jetbrains": JETBRAINS_FIND_RESPONSE,
            "kde": {
                "results": [
                    _snap_result(
                        "krita",
                        "Krita",
                        _publisher("kde", "KDE", "verified"),
                    )
                ]
            },
            "newpartner": {
                "results": [
                    _snap_result(
                        "newpartner-snap",
                        "New Partner Snap",
                        _publisher(
                            "newpartner",
                            "New Partner",
                            "verified",
                        ),
                    )
                ]
            },
        }

        self._set_custom_registry_entry(
            "newpartner",
            {
                "display_name": "New Partner",
                "summary": "Summary",
                "description": "<p>description</p>",
                "publisher_since": "January 2024",
            },
        )

        for publisher_name, find_response in fixtures.items():
            with self.subTest(publisher_name=publisher_name):
                responses.add(
                    responses.GET,
                    self.api_url_find(publisher_name),
                    json=find_response,
                    status=200,
                )

                response = self.client.get(f"/publisher/{publisher_name}")
                body = response.get_data(as_text=True)

                self.assertEqual(response.status_code, 200)
                self.assert_template_used("store/publisher-details.html")

                verified_index = body.find("Verified account")
                first_snap_index = body.find(
                    'class="p-media-object p-media-object--snap"'
                )

                self.assertGreaterEqual(verified_index, 0)
                self.assertGreaterEqual(first_snap_index, 0)
                self.assertLess(verified_index, first_snap_index)

    @responses.activate
    def test_star_status_precedes_first_snap_for_snapcrafters(self):
        responses.add(
            responses.GET,
            self.api_url_find("snapcrafters"),
            json=SNAPCRAFTERS_FIND_RESPONSE,
            status=200,
        )

        response = self.client.get("/publisher/snapcrafters")
        body = response.get_data(as_text=True)

        self.assertEqual(response.status_code, 200)
        self.assert_template_used("store/publisher-details.html")

        star_index = body.find("Star developer")
        first_snap_index = body.find(
            'class="p-media-object p-media-object--snap"'
        )

        self.assertGreaterEqual(star_index, 0)
        self.assertGreaterEqual(first_snap_index, 0)
        self.assertLess(star_index, first_snap_index)

    @responses.activate
    def test_custom_page_without_store_validation_hides_status_badges(self):
        self._set_custom_registry_entry(
            "nostatus",
            {
                "display_name": "No Status",
                "summary": "Summary",
                "description": "<p>description</p>",
                "publisher_since": "January 2024",
            },
        )

        responses.add(
            responses.GET,
            self.api_url_find("nostatus"),
            json={
                "results": [
                    _snap_result(
                        "nostatus-snap",
                        "No Status Snap",
                        _publisher("nostatus", "No Status", "unproven"),
                    )
                ]
            },
            status=200,
        )

        response = self.client.get("/publisher/nostatus")
        body = response.get_data(as_text=True)

        self.assertEqual(response.status_code, 200)
        self.assert_template_used("store/publisher-details.html")
        self.assertNotIn("Verified account", body)
        self.assertNotIn("Star developer", body)

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
    def test_non_curated_layout_shows_all_non_featured_public_snaps(self):
        responses.add(
            responses.GET,
            self.api_url_find("jetbrains"),
            json={
                "results": [
                    _snap_result(
                        "intellij-idea",
                        "IntelliJ IDEA",
                        JETBRAINS_PUBLISHER,
                    ),
                    _snap_result(
                        "goland",
                        "GoLand",
                        JETBRAINS_PUBLISHER,
                    ),
                ]
            },
            status=200,
        )

        response = self.client.get("/publisher/jetbrains")

        self.assertEqual(response.status_code, 200)
        self.assert_template_used("store/publisher-details.html")

        rendered_snaps = self.get_context_variable("snaps")
        self.assertEqual(
            [snap["package_name"] for snap in rendered_snaps],
            ["goland"],
        )
        self.assertFalse(self.get_context_variable("show_all_snaps_link"))

    @responses.activate
    def test_curated_layout_omits_unavailable_curated_entries(self):
        for missing_variant in (
            "missing-listed",
            "other-publisher-listed",
        ):
            with self.subTest(missing_variant=missing_variant):
                self._set_custom_registry_entry(
                    "newpartner",
                    {
                        "display_name": "New Partner",
                        "summary": "Summary",
                        "description": "<p>description</p>",
                        "publisher_since": "January 2024",
                        "featured_snaps": [
                            {
                                "package_name": "featured-available",
                                "background": "#000000",
                                "description": "featured",
                            },
                            {
                                "package_name": "missing-featured",
                                "background": "#111111",
                                "description": "missing",
                            },
                        ],
                        "listed_snaps": [
                            {"package_name": "listed-available-first"},
                            {"package_name": missing_variant},
                            {"package_name": "listed-available-second"},
                        ],
                    },
                )

                responses.add(
                    responses.GET,
                    self.api_url_find("newpartner"),
                    json={
                        "results": [
                            _snap_result(
                                "featured-available",
                                "Featured Available",
                                _publisher(
                                    "newpartner",
                                    "New Partner",
                                    "verified",
                                ),
                            ),
                            _snap_result(
                                "listed-available-second",
                                "Listed Available Second",
                                _publisher(
                                    "newpartner",
                                    "New Partner",
                                    "verified",
                                ),
                            ),
                            _snap_result(
                                "listed-available-first",
                                "Listed Available First",
                                _publisher(
                                    "newpartner",
                                    "New Partner",
                                    "verified",
                                ),
                            ),
                        ]
                    },
                    status=200,
                )

                response = self.client.get("/publisher/newpartner")
                body = response.get_data(as_text=True)

                self.assertEqual(response.status_code, 200)
                self.assert_template_used("store/publisher-details.html")

                featured_snaps = self.get_context_variable("featured_snaps")
                self.assertEqual(
                    [snap["package_name"] for snap in featured_snaps],
                    ["featured-available"],
                )

                listed_snaps = self.get_context_variable("snaps")
                self.assertEqual(
                    [snap["package_name"] for snap in listed_snaps],
                    ["listed-available-first", "listed-available-second"],
                )

                self.assertNotIn('href="/missing-featured"', body)
                self.assertNotIn(
                    f'href="/{missing_variant}"',
                    body,
                )

    @responses.activate
    def test_curated_layout_hides_featured_section_when_featured_missing(
        self,
    ):
        self._set_custom_registry_entry(
            "newpartner",
            {
                "display_name": "New Partner",
                "summary": "Summary",
                "description": "<p>description</p>",
                "publisher_since": "January 2024",
                "featured_snaps": [
                    {
                        "package_name": "missing-featured-a",
                        "background": "#000000",
                        "description": "missing",
                    },
                    {
                        "package_name": "missing-featured-b",
                        "background": "#111111",
                        "description": "missing",
                    },
                ],
                "listed_snaps": [{"package_name": "listed-available"}],
            },
        )

        responses.add(
            responses.GET,
            self.api_url_find("newpartner"),
            json={
                "results": [
                    _snap_result(
                        "listed-available",
                        "Listed Available",
                        _publisher("newpartner", "New Partner", "verified"),
                    )
                ]
            },
            status=200,
        )

        response = self.client.get("/publisher/newpartner")
        body = response.get_data(as_text=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.get_context_variable("featured_snaps"), [])
        self.assertNotIn("p-featured-snap", body)

    @responses.activate
    def test_empty_results_with_curated_content_keep_section_states(
        self,
    ):
        responses.add(
            responses.GET,
            self.api_url_find("snapcrafters"),
            json={"results": []},
            status=200,
        )

        response = self.client.get("/publisher/snapcrafters")
        body = response.get_data(as_text=True)

        self.assertEqual(response.status_code, 200)
        self.assert_template_used("store/publisher-details.html")
        self.assertIn('<h2 class="p-heading--4">Snaps</h2>', body)
        self.assertIn(
            "This publisher's snaps are not available right now.",
            body,
        )
        self.assertIn("See all snaps published by Snapcrafters", body)
        self.assertNotIn('class="p-media-object p-media-object--snap"', body)

    @responses.activate
    def test_all_production_custom_pages_render(self):
        custom_publisher_pages = sorted(
            self.app.extensions["publisher_pages_registry"].keys()
        )

        for publisher in custom_publisher_pages:
            responses.add(
                responses.GET,
                self.api_url_find(publisher),
                json={
                    "results": [
                        _snap_result(
                            f"{publisher}-snap",
                            f"{publisher} snap",
                            _publisher(
                                publisher,
                                publisher.title(),
                                "verified",
                            ),
                        )
                    ]
                },
                status=200,
            )

            response = self.client.get(f"/publisher/{publisher}")
            self.assertEqual(response.status_code, 200)
            self.assert_template_used("store/publisher-details.html")

    @responses.activate
    def test_custom_page_without_listed_snaps_hides_see_all_link(self):
        responses.add(
            responses.GET,
            self.api_url_find("jetbrains"),
            json=JETBRAINS_FIND_RESPONSE,
            status=200,
        )

        response = self.client.get("/publisher/jetbrains")
        body = response.get_data(as_text=True)

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("See all snaps published by", body)

    @responses.activate
    def test_curated_page_shows_note_when_listed_snaps_are_unavailable(self):
        responses.add(
            responses.GET,
            self.api_url_find("snapcrafters"),
            json={
                "results": [
                    _snap_result(
                        "alacritty",
                        "Alacritty",
                        _publisher("snapcrafters", "Snapcrafters", "starred"),
                    )
                ]
            },
            status=200,
        )

        response = self.client.get("/publisher/snapcrafters")
        body = response.get_data(as_text=True)

        self.assertEqual(response.status_code, 200)
        self.assertIn(
            "This publisher's snaps are not available right now.",
            body,
        )
        self.assertIn("See all snaps published by Snapcrafters", body)
        self.assertNotIn('href="/sublime-text"', body)

    @responses.activate
    def test_duplicate_featured_and_listed_snap_is_rendered_once(self):
        self._set_custom_registry_entry(
            "newpartner",
            {
                "display_name": "New Partner",
                "summary": "Summary",
                "description": "<p>description</p>",
                "publisher_since": "January 2024",
                "featured_snaps": [
                    {
                        "package_name": "dup-snap",
                        "background": "#000000",
                        "description": "dup",
                    }
                ],
                "listed_snaps": [{"package_name": "dup-snap"}],
            },
        )

        responses.add(
            responses.GET,
            self.api_url_find("newpartner"),
            json={
                "results": [
                    _snap_result(
                        "dup-snap",
                        "Dup Snap",
                        _publisher("newpartner", "New Partner", "verified"),
                    )
                ]
            },
            status=200,
        )

        response = self.client.get("/publisher/newpartner")
        body = response.get_data(as_text=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(body.count('href="/dup-snap"'), 1)

    @responses.activate
    def test_page_renders_with_required_fields_only(self):
        self._set_custom_registry_entry(
            "minimalpartner",
            {
                "display_name": "Minimal Partner",
                "summary": "Summary",
                "description": "<p>description</p>",
                "publisher_since": "January 2024",
            },
        )

        responses.add(
            responses.GET,
            self.api_url_find("minimalpartner"),
            json={
                "results": [
                    _snap_result(
                        "minimal-snap",
                        "Minimal Snap",
                        _publisher(
                            "minimalpartner",
                            "Minimal Partner",
                            "unproven",
                        ),
                    )
                ]
            },
            status=200,
        )

        response = self.client.get("/publisher/minimalpartner")
        body = response.get_data(as_text=True)

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("Visit publisher website", body)
        self.assertNotIn("Contact publisher", body)
        self.assertNotIn("See all snaps published by", body)

    @responses.activate
    def test_optional_content_omissions_keep_page_complete(self):
        base_content = {
            "display_name": "Optional Partner",
            "summary": "Summary",
            "description": "<p>description</p>",
            "publisher_since": "January 2024",
            "icon_url": "https://assets.ubuntu.com/v1/optional-icon.png",
            "website": "https://example.com",
            "contact": "mailto:optional@example.com",
            "banner_url": "https://assets.ubuntu.com/v1/optional-banner.png",
            "meta_description": "Custom optional meta description",
            "featured_snaps": [
                {
                    "package_name": "featured-snap",
                    "background": "#000000",
                    "description": "featured",
                }
            ],
            "listed_snaps": [{"package_name": "listed-snap"}],
        }

        optional_variants = {
            "omit-icon": {"icon_url"},
            "omit-banner": {"banner_url"},
            "omit-website": {"website"},
            "omit-contact": {"contact"},
            "omit-featured": {"featured_snaps"},
            "omit-listed": {"listed_snaps"},
            "omit-all-optional": {
                "icon_url",
                "website",
                "contact",
                "banner_url",
                "meta_description",
                "featured_snaps",
                "listed_snaps",
            },
        }

        for variant_name, omitted_keys in optional_variants.items():
            with self.subTest(variant_name=variant_name):
                publisher_name = f"optional-{variant_name}"
                content = copy.deepcopy(base_content)
                for key in omitted_keys:
                    content.pop(key, None)

                self._set_custom_registry_entry(publisher_name, content)

                responses.add(
                    responses.GET,
                    self.api_url_find(publisher_name),
                    json={
                        "results": [
                            _snap_result(
                                "featured-snap",
                                "Featured Snap",
                                _publisher(
                                    publisher_name,
                                    "Optional Partner",
                                    "verified",
                                ),
                            ),
                            _snap_result(
                                "listed-snap",
                                "Listed Snap",
                                _publisher(
                                    publisher_name,
                                    "Optional Partner",
                                    "verified",
                                ),
                            ),
                            _snap_result(
                                "extra-snap",
                                "Extra Snap",
                                _publisher(
                                    publisher_name,
                                    "Optional Partner",
                                    "verified",
                                ),
                            ),
                        ]
                    },
                    status=200,
                )

                response = self.client.get(f"/publisher/{publisher_name}")
                body = response.get_data(as_text=True)

                self.assertEqual(response.status_code, 200)
                self.assert_template_used("store/publisher-details.html")

                content_only = re.search(
                    (
                        r'(<div class="p-strip--dark is-shallow"'
                        r'.*?<footer class="l-footer--sticky)'
                    ),
                    body,
                    re.S,
                )
                self.assertIsNotNone(content_only)
                page_content = content_only.group(1)

                self.assertNotIn('href="#"', page_content)
                self.assertNotIn('href=""', page_content)
                self.assertNotIn('src=""', page_content)

                if "icon_url" in omitted_keys:
                    self.assertIn("snapcraft-default-snap-icon.svg", body)
                if "banner_url" in omitted_keys:
                    self.assertNotIn("p-strip--image", body)
                if "website" in omitted_keys:
                    self.assertNotIn("Visit publisher website", body)
                if "contact" in omitted_keys:
                    self.assertNotIn("Contact publisher", body)
                if "featured_snaps" in omitted_keys:
                    self.assertNotIn("p-featured-snap", body)

                if "listed_snaps" in omitted_keys:
                    self.assertNotIn(
                        "See all snaps published by Optional Partner",
                        body,
                    )
                    self.assertIn('href="/listed-snap"', body)
                    self.assertIn('href="/extra-snap"', body)
                else:
                    self.assertIn(
                        "See all snaps published by Optional Partner",
                        body,
                    )

    @responses.activate
    def test_meta_description_falls_back_when_omitted(self):
        self._set_custom_registry_entry(
            "metafallback",
            {
                "display_name": "Meta Fallback",
                "summary": "Summary",
                "description": "<p>description</p>",
                "publisher_since": "January 2024",
            },
        )

        responses.add(
            responses.GET,
            self.api_url_find("metafallback"),
            json={
                "results": [
                    _snap_result(
                        "metafallback-snap",
                        "Meta Fallback Snap",
                        _publisher(
                            "metafallback",
                            "Meta Fallback",
                            "verified",
                        ),
                    )
                ]
            },
            status=200,
        )

        response = self.client.get("/publisher/metafallback")
        body = response.get_data(as_text=True)

        self.assertEqual(response.status_code, 200)
        self.assertIn(
            "Install Meta Fallback software for Linux in the Snap Store",
            body,
        )

    @responses.activate
    def test_decorative_icon_and_banner_are_hidden_from_screen_readers(self):
        self._set_custom_registry_entry(
            "decorativepartner",
            {
                "display_name": "Decorative Partner",
                "summary": "Summary",
                "description": "<p>description</p>",
                "publisher_since": "January 2024",
                "icon_url": "https://assets.ubuntu.com/v1/decorative-icon.png",
                "banner_url": (
                    "https://assets.ubuntu.com/v1/decorative-banner.png"
                ),
            },
        )

        responses.add(
            responses.GET,
            self.api_url_find("decorativepartner"),
            json={
                "results": [
                    _snap_result(
                        "decorative-snap",
                        "Decorative Snap",
                        _publisher(
                            "decorativepartner",
                            "Decorative Partner",
                            "verified",
                        ),
                    )
                ]
            },
            status=200,
        )

        response = self.client.get("/publisher/decorativepartner")
        body = response.get_data(as_text=True)

        self.assertEqual(response.status_code, 200)

        self.assertRegex(
            body,
            r'<img class="p-snap-heading__icon"[^>]*alt=""',
        )
        self.assertIn(
            'class="p-strip--image is-deep"',
            body,
        )
        self.assertIn(
            "https://assets.ubuntu.com/v1/decorative-banner.png",
            body,
        )
        self.assertNotIn(
            '<img src="https://assets.ubuntu.com/v1/decorative-banner.png"',
            body,
        )

    @responses.activate
    def test_custom_page_uses_cached_publisher_snaps(self):
        cached_results = [
            _snap_result(
                "cached-snap",
                "Cached Snap",
                _publisher("jetbrains", "JetBrains", "verified"),
            )
        ]
        redis_cache.set("publisher-snaps:jetbrains", cached_results, ttl=3600)

        # No HTTP mock registered: a cache miss would raise
        # ConnectionError instead of calling the API.
        response = self.client.get("/publisher/jetbrains")

        self.assertEqual(response.status_code, 200)
        self.assert_template_used("store/publisher-details.html")
        rendered_snaps = self.get_context_variable("snaps")
        self.assertEqual(
            [snap["package_name"] for snap in rendered_snaps],
            ["cached-snap"],
        )

    @responses.activate
    def test_custom_registry_is_not_mutated_by_repeated_requests(self):
        find_responses = {
            "jetbrains": JETBRAINS_FIND_RESPONSE,
            "kde": {
                "results": [
                    _snap_result(
                        "krita",
                        "Krita",
                        _publisher("kde", "KDE", "verified"),
                    )
                ]
            },
            "snapcrafters": SNAPCRAFTERS_FIND_RESPONSE,
        }

        for publisher_name, find_response in find_responses.items():
            responses.add(
                responses.GET,
                self.api_url_find(publisher_name),
                json=find_response,
                status=200,
            )

        registry_before = copy.deepcopy(
            self.app.extensions["publisher_pages_registry"]
        )

        for publisher_name in ("jetbrains", "kde", "snapcrafters"):
            for _ in range(3):
                response = self.client.get(f"/publisher/{publisher_name}")
                self.assertEqual(response.status_code, 200)

        self.assertEqual(
            registry_before,
            self.app.extensions["publisher_pages_registry"],
        )
