import unittest
from webapp.publisher.cve.cve_helper import CveHelper


class CveSortDataTest(unittest.TestCase):
    def setUp(self):
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

    def test_sort_by_cvss_severity_asc(self):
        sorted_cves = CveHelper.sort_cve_data(
            self.cves, "cvss_severity", "asc"
        )
        self.assertEqual(
            [cve["id"] for cve in sorted_cves],
            [
                "CVE-2023-1002",
                "CVE-2023-1004",
                "CVE-2023-1001",
                "CVE-2023-1003",
            ],
        )

    def test_sort_by_cvss_severity_desc(self):
        sorted_cves = CveHelper.sort_cve_data(
            self.cves, "cvss_severity", "desc"
        )
        self.assertEqual(
            [cve["id"] for cve in sorted_cves],
            [
                "CVE-2023-1003",
                "CVE-2023-1001",
                "CVE-2023-1004",
                "CVE-2023-1002",
            ],
        )

    def test_sort_by_ubuntu_priority_asc(self):
        sorted_cves = CveHelper.sort_cve_data(
            self.cves, "ubuntu_priority", "asc"
        )
        self.assertEqual(
            [cve["id"] for cve in sorted_cves],
            [
                "CVE-2023-1003",
                "CVE-2023-1001",
                "CVE-2023-1002",
                "CVE-2023-1004",
            ],
        )

    def test_sort_by_cvss_score_desc(self):
        sorted_cves = CveHelper.sort_cve_data(
            self.cves, "cvss_score", "desc"
        )
        self.assertEqual(
            [cve["id"] for cve in sorted_cves],
            [
                "CVE-2023-1003",
                "CVE-2023-1001",
                "CVE-2023-1004",
                "CVE-2023-1002",
            ],
        )

    def test_sort_by_unknown_field(self):
        sorted_cves = CveHelper.sort_cve_data(self.cves, "id", "asc")
        self.assertEqual(
            [cve["id"] for cve in sorted_cves],
            [
                "CVE-2023-1001",
                "CVE-2023-1002",
                "CVE-2023-1003",
                "CVE-2023-1004",
            ],
        )
