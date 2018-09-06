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
