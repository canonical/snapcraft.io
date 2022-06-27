import unittest

import datetime
from freezegun import freeze_time
import webapp.store.logic as logic


class StoreLogicTest(unittest.TestCase):

    # convert_channel_maps
    # ===
    def test_empty_channel_map(self):
        channel_maps_list = []
        result = logic.convert_channel_maps(channel_maps_list)

        self.assertEqual(result, {})

    def test_one_track_channel_map(self):
        channel_maps_list = [
            {
                "channel": {
                    "name": "channel",
                    "architecture": "arch",
                    "track": "track",
                    "risk": "risk",
                    "released-at": "2019-01-12T16:48:41.821037+00:00",
                },
                "created-at": "2019-01-12T16:48:41.821037+00:00",
                "confinement": "confinement",
                "download": {"size": "size"},
                "version": "version",
            }
        ]

        result = logic.convert_channel_maps(channel_maps_list)
        expected_result = {
            "arch": {
                "track": [
                    {
                        "channel": "channel",
                        "released-at": "12 January 2019",
                        "confinement": "confinement",
                        "size": "size",
                        "risk": "risk",
                        "version": "version",
                    }
                ]
            }
        }

        self.assertEqual(result, expected_result)

    def test_multiple_track_same_arch_channel_map(self):
        channel_maps_list = [
            {
                "channel": {
                    "name": "channel",
                    "architecture": "arch",
                    "track": "track",
                    "risk": "risk",
                    "released-at": "2019-01-12T16:48:41.821037+00:00",
                },
                "created-at": "2019-01-12T16:48:41.821037+00:00",
                "confinement": "confinement",
                "download": {"size": "size"},
                "version": "version",
            },
            {
                "channel": {
                    "name": "channel",
                    "architecture": "arch",
                    "track": "track1",
                    "risk": "risk",
                    "released-at": "2019-01-12T16:48:41.821037+00:00",
                },
                "created-at": "2019-01-12T16:48:41.821037+00:00",
                "confinement": "confinement",
                "download": {"size": "size"},
                "version": "version",
            },
        ]
        result = logic.convert_channel_maps(channel_maps_list)
        expected_result = {
            "arch": {
                "track": [
                    {
                        "channel": "channel",
                        "released-at": "12 January 2019",
                        "confinement": "confinement",
                        "size": "size",
                        "risk": "risk",
                        "version": "version",
                    }
                ],
                "track1": [
                    {
                        "channel": "channel",
                        "released-at": "12 January 2019",
                        "confinement": "confinement",
                        "size": "size",
                        "risk": "risk",
                        "version": "version",
                    }
                ],
            }
        }

        self.assertEqual(result, expected_result)

    def test_multiple_track_different_arch_channel_map(self):
        channel_maps_list = [
            {
                "channel": {
                    "name": "channel",
                    "architecture": "arch",
                    "track": "track",
                    "risk": "risk",
                    "released-at": "2019-01-12T16:48:41.821037+00:00",
                },
                "created-at": "2019-01-12T16:48:41.821037+00:00",
                "confinement": "confinement",
                "download": {"size": "size"},
                "version": "version",
            },
            {
                "channel": {
                    "name": "channel",
                    "architecture": "arch1",
                    "track": "track",
                    "risk": "risk",
                    "released-at": "2019-01-12T16:48:41.821037+00:00",
                },
                "created-at": "2019-01-12T16:48:41.821037+00:00",
                "confinement": "confinement",
                "download": {"size": "size"},
                "version": "version",
            },
        ]

        result = logic.convert_channel_maps(channel_maps_list)
        expected_result = {
            "arch": {
                "track": [
                    {
                        "channel": "channel",
                        "released-at": "12 January 2019",
                        "confinement": "confinement",
                        "size": "size",
                        "risk": "risk",
                        "version": "version",
                    }
                ]
            },
            "arch1": {
                "track": [
                    {
                        "channel": "channel",
                        "released-at": "12 January 2019",
                        "confinement": "confinement",
                        "size": "size",
                        "risk": "risk",
                        "version": "version",
                    }
                ]
            },
        }

        self.assertEqual(result, expected_result)

    def test_get_lowest_available_risk(self):
        channel_map = {"arch": {"track": [{"risk": "edge"}]}}
        edge_result = logic.get_lowest_available_risk(channel_map, "track")
        self.assertEqual(edge_result, "edge")

        channel_map["arch"]["track"].append({"risk": "beta"})
        beta_result = logic.get_lowest_available_risk(channel_map, "track")
        self.assertEqual(beta_result, "beta")

        channel_map["arch"]["track"].append({"risk": "candidate"})
        cand_result = logic.get_lowest_available_risk(channel_map, "track")
        self.assertEqual(cand_result, "candidate")

        channel_map["arch"]["track"].append({"risk": "stable"})
        stable_result = logic.get_lowest_available_risk(channel_map, "track")
        self.assertEqual(stable_result, "stable")

        # assert that channel_map has been updated successfully
        self.assertEqual(
            channel_map,
            {
                "arch": {
                    "track": [
                        {"risk": "edge"},
                        {"risk": "beta"},
                        {"risk": "candidate"},
                        {"risk": "stable"},
                    ]
                }
            },
        )

    def test_get_version(self):
        channel_map = {
            "arch": {
                "track": [
                    {"risk": "edge", "version": "12"},
                    {"risk": "stable", "version": "10"},
                ]
            }
        }
        edge_version = logic.extract_info_channel_map(
            channel_map, "track", "edge"
        )["version"]
        self.assertEqual(edge_version, "12")

        stable_version = logic.extract_info_channel_map(
            channel_map, "track", "stable"
        )["version"]
        self.assertEqual(stable_version, "10")

    def test_get_no_version(self):
        channel_map = {
            "arch": {"track": [{"risk": "stable", "version": "10"}]}
        }
        no_version = logic.extract_info_channel_map(
            channel_map, "track", "edge"
        )["version"]
        self.assertEqual(no_version, None)

    def test_get_confinement(self):
        channel_map = {
            "arch": {
                "track": [
                    {"risk": "edge", "confinement": "classic"},
                    {"risk": "stable", "confinement": "strict"},
                ]
            }
        }
        classic_result = logic.extract_info_channel_map(
            channel_map, "track", "edge"
        )["confinement"]
        self.assertEqual(classic_result, "classic")

        strict_result = logic.extract_info_channel_map(
            channel_map, "track", "stable"
        )["confinement"]
        self.assertEqual(strict_result, "strict")

    def test_get_no_confinement(self):
        channel_map = {
            "arch": {"track": [{"risk": "stable", "confinement": "strict"}]}
        }
        no_version = logic.extract_info_channel_map(
            channel_map, "track", "edge"
        )["confinement"]
        self.assertEqual(no_version, None)

    def test_get_categories(self):
        categories = {
            "categories": [
                {"name": "featured"},
                {"name": "test"},
                {"name": "development"},
            ]
        }
        category_list = logic.get_categories(categories)
        self.assertTrue(
            {"name": "Development", "slug": "development"} in category_list
        )
        self.assertTrue({"name": "Games", "slug": "games"} in category_list)
        self.assertTrue({"name": "Test", "slug": "test"} in category_list)

    def test_get_video_embed_code(self):
        youtube_url = "https://youtube.com/watch?v=123"
        embed = logic.get_video_embed_code(youtube_url)
        self.assertEqual(
            embed,
            {
                "type": "youtube",
                "url": "https://youtube.com/embed/123",
                "id": "123",
            },
        )

        youtu_be_url = "https://youtu.be/123"
        embed = logic.get_video_embed_code(youtu_be_url)
        self.assertEqual(
            embed,
            {
                "type": "youtube",
                "url": "https://youtube.com/embed/123",
                "id": "123",
            },
        )

        vimeo_url = "https://vimeo.com/123123"
        embed = logic.get_video_embed_code(vimeo_url)
        self.assertEqual(
            embed,
            {
                "type": "vimeo",
                "url": "https://player.vimeo.com/video/123123",
                "id": "123123",
            },
        )

        asciicinema_url = "https://asciinema.org/a/123"
        embed = logic.get_video_embed_code(asciicinema_url)
        self.assertEqual(
            embed,
            {
                "type": "asciinema",
                "url": "https://asciinema.org/a/123.js",
                "id": "123",
            },
        )

    def test_convert_date_more_than_yesterday(self):
        date_test = "2019-01-12T16:48:41.821037+00:00"
        result = logic.convert_date(date_test)

        self.assertEqual(result, "12 January 2019")

    def test_convert_date_more_today(self):
        date_test = datetime.datetime.now().strftime("%Y-%m-%d")
        result = logic.convert_date(date_test)

        self.assertEqual(result, "Today")

    @freeze_time("2021-05-12 10:38:34", tz_offset=-6)
    def test_convert_date_timezone_yesterday(self):
        date_test = "2021-05-11T10:48:41.821037-06:00"
        result = logic.convert_date(date_test)

        self.assertEqual(result, "Yesterday")

    def test_get_snap_banner(self):
        snap_with_banner = {
            "media": [
                {"type": "icon", "url": "icon.png"},
                {"type": "banner", "url": "banner.png"},
                {"type": "screenshot", "url": "screenshot.png"},
            ]
        }

        result = logic.get_snap_banner_url(snap_with_banner)

        self.assertEqual(result.get("banner_url"), "banner.png")

    def test_get_snap_banner_no_banner(self):
        snap_with_banner = {
            "media": [
                {"type": "icon", "url": "icon.png"},
                {"type": "screenshot", "url": "screenshot.png"},
            ]
        }

        result = logic.get_snap_banner_url(snap_with_banner)

        self.assertEqual(result.get("banner_url"), None)
