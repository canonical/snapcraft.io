import unittest
from webapp.publisher.cve.cve_helper import CveHelper


class CveHelperPaginateDataTest(unittest.TestCase):

    def setUp(self):
        self.helper = CveHelper()
        self.cves = [
            {
                "id": "CVE-2023-1001",
                "cvss_severity": "high",
                "ubuntu_priority": "medium",
                "cvss_score": 7.5,
            },
            {
                "id": "CVE-2023-1002",
                "cvss_severity": "low",
                "ubuntu_priority": "high",
                "cvss_score": 4.3,
            },
            {
                "id": "CVE-2023-1003",
                "cvss_severity": "critical",
                "ubuntu_priority": "low",
                "cvss_score": 9.8,
            },
            {
                "id": "CVE-2023-1004",
                "cvss_severity": "medium",
                "ubuntu_priority": "critical",
                "cvss_score": 6.1,
            },
        ]

    def test_paginate_cve_list(self):
        paginated_cves = self.helper.paginate_cve_list(
            self.cves, page=1, page_size=2
        )
        self.assertEqual(paginated_cves["page"], 1)
        self.assertEqual(paginated_cves["page_size"], 2)
        self.assertEqual(paginated_cves["total_items"], 4)
        self.assertEqual(paginated_cves["total_pages"], 2)
        self.assertEqual(len(paginated_cves["data"]), 2)
        self.assertEqual(
            [cve["id"] for cve in paginated_cves["data"]],
            ["CVE-2023-1001", "CVE-2023-1002"],
        )
