import unittest

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
                },
                "created-at": "date",
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
                        "created-at": "date",
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
                },
                "created-at": "date",
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
                },
                "created-at": "date",
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
                        "created-at": "date",
                        "confinement": "confinement",
                        "size": "size",
                        "risk": "risk",
                        "version": "version",
                    }
                ],
                "track1": [
                    {
                        "channel": "channel",
                        "created-at": "date",
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
                },
                "created-at": "date",
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
                },
                "created-at": "date",
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
                        "created-at": "date",
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
                        "created-at": "date",
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
        edge_version = logic.get_version(channel_map, "track", "edge")
        self.assertEqual(edge_version, "12")

        stable_version = logic.get_version(channel_map, "track", "stable")
        self.assertEqual(stable_version, "10")

    def test_get_no_version(self):
        channel_map = {
            "arch": {"track": [{"risk": "stable", "version": "10"}]}
        }
        no_version = logic.get_version(channel_map, "track", "edge")
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
        classic_result = logic.get_confinement(channel_map, "track", "edge")
        self.assertEqual(classic_result, "classic")

        strict_result = logic.get_confinement(channel_map, "track", "stable")
        self.assertEqual(strict_result, "strict")

    def test_get_no_confinement(self):
        channel_map = {
            "arch": {"track": [{"risk": "stable", "confinement": "strict"}]}
        }
        no_version = logic.get_confinement(channel_map, "track", "edge")
        self.assertEqual(no_version, None)

    def test_get_categories(self):
        categories = {
            "_embedded": {
                "clickindex:sections": [
                    {"name": "featured"},
                    {"name": "test"},
                    {"name": "developers"},
                ]
            }
        }
        category_list = logic.get_categories(categories)
        self.assertEqual(
            category_list,
            [
                {"name": "Developers", "slug": "developers"},
                {"name": "Games", "slug": "games"},
                {"name": "Social networking", "slug": "social-networking"},
                {"name": "Test", "slug": "test"},
            ],
        )

    def test_get_video_embed_code(self):
        youtube_url = "https://youtube.com/watch?v=123"
        embed = logic.get_video_embed_code(youtube_url)
        self.assertEqual(
            embed, {"type": "youtube", "url": "https://youtube.com/embed/123"}
        )

        vimeo_url = "https://vimeo.com/123123"
        embed = logic.get_video_embed_code(vimeo_url)
        self.assertEqual(
            embed,
            {"type": "vimeo", "url": "https://player.vimeo.com/video/123123"},
        )

        asciicinema_url = "https://asciinema.org/a/123"
        embed = logic.get_video_embed_code(asciicinema_url)
        self.assertEqual(
            embed,
            {"type": "asciinema", "url": "https://asciinema.org/a/123.js"},
        )
