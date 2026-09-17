import unittest

import webapp.metrics.metrics as metrics


class OsMetricTest(unittest.TestCase):
    def test_capitalize_os_name(self):
        self.assertEqual(
            metrics._capitalize_os_name("ubuntu/24.04"), "Ubuntu 24.04"
        )
        self.assertEqual(metrics._capitalize_os_name("arch/-"), "Arch Linux")
        self.assertEqual(metrics._capitalize_os_name("kylin/v10"), "kylin v10")

    def test_build_os_tree(self):
        oses = [
            {"name": "ubuntu/22.04", "values": [0.2]},
            {"name": "ubuntu/24.04", "values": [0.3]},
            {"name": "debian/12", "values": [0.1]},
            {"name": "solus/-", "values": [0.2]},
            {"name": "empty/1", "values": [0]},
        ]

        os_metrics = metrics.OsMetric(None, oses, None, None)
        expected_result = [
            {
                "name": "Ubuntu",
                "slug": "ubuntu",
                "value": 0.3,
                "rank": 1,
                "children": [
                    {"name": "24.04", "value": 0.3, "rank": 1},
                    {"name": "22.04", "value": 0.2, "rank": 2},
                ],
            },
            {
                "name": "Solus",
                "slug": "solus",
                "value": 0.2,
                "rank": 2,
                "children": [{"name": "Solus", "value": 0.2, "rank": 2}],
            },
            {
                "name": "Debian",
                "slug": "debian",
                "value": 0.1,
                "rank": 3,
                "children": [{"name": "12", "value": 0.1, "rank": 4}],
            },
        ]

        self.assertEqual(os_metrics.os_tree, expected_result)
