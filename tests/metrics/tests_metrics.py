import unittest

import webapp.metrics.metrics as metrics


class OsMetricTest(unittest.TestCase):
    def test_build_os_info(self):
        oses = [
            {"name": "test/-", "values": ["0.1"]},
            {"name": "test2/test", "values": ["0.5", "0.9"]},
        ]

        os_metrics = metrics.OsMetric(None, oses, None, None)
        expected_result = [
            {"name": "test2 test", "value": "0.9"},
            {"name": "test", "value": "0.1"},
        ]

        self.assertEqual(os_metrics.os, expected_result)


class GetUsageContextTest(unittest.TestCase):
    def test_splits_ubuntu_from_other_distros(self):
        oses = [
            {"name": "Ubuntu 24.04", "value": 1.0},
            {"name": "Fedora 40", "value": 0.8},
            {"name": "ubuntu core 22", "value": 0.5},
            {"name": "Debian 12", "value": 0.4},
        ]

        context = metrics.get_usage_context(None, oses)

        self.assertEqual(
            [o["name"] for o in context["ubuntu_os"]],
            ["Ubuntu 24.04", "ubuntu core 22"],
        )
        self.assertEqual(
            [o["name"] for o in context["other_os"]],
            ["Fedora 40", "Debian 12"],
        )

    def test_counts_countries_with_users(self):
        countries = {
            "250": {"percentage_of_users": 0.2},
            "276": {"percentage_of_users": 0},
            "826": {"percentage_of_users": 0.01},
        }

        context = metrics.get_usage_context(countries, None)

        self.assertEqual(context["countries_with_users"], 2)

    def test_no_data(self):
        self.assertEqual(
            metrics.get_usage_context(None, None),
            {"countries_with_users": 0, "ubuntu_os": [], "other_os": []},
        )
