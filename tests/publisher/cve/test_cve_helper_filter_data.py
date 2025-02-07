import unittest
from webapp.publisher.cve.cve_helper import CveHelper


class CveHelperFilterDataTest(unittest.TestCase):
    def setUp(self):
        self.helper = CveHelper()
        self.cves = [
            {
                "id": "CVE-2023-12345",
                "cvss_severity": "high",
                "ubuntu_priority": "medium",
                "usns": [{"id": "3009-1"}],
                "affected_binaries": [
                    {
                        "name": "libssl",
                        "status": "fixed",
                        "version": "1.2.3",
                        "fixed_version": "1.2.4",
                    },
                    {
                        "name": "openssl",
                        "status": "unfixed",
                        "version": "1.1.1",
                        "fixed_version": None,
                    },
                ],
            },
            {
                "id": "CVE-2024-67890",
                "cvss_severity": "critical",
                "ubuntu_priority": "high",
                "usns": [{"id": "3010-2"}],
                "affected_binaries": [
                    {
                        "name": "bash",
                        "status": "fixed",
                        "version": "5.0",
                        "fixed_version": "5.1",
                    },
                ],
            },
        ]

    def test_filter_by_cvss_severity(self):
        result = self.helper.filter_cve_data(
            self.cves,
            usn_ids=None,
            binary_statuses=None,
            binary_versions=None,
            binary_fixed_versions=None,
            binary_names=None,
            cvss_severities=["high"],
            ubuntu_priorities=None,
        )
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["id"], "CVE-2023-12345")

    def test_filter_by_ubuntu_priority(self):
        result = self.helper.filter_cve_data(
            self.cves,
            usn_ids=None,
            binary_statuses=None,
            binary_versions=None,
            binary_fixed_versions=None,
            binary_names=None,
            cvss_severities=None,
            ubuntu_priorities=["high"],
        )
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["id"], "CVE-2024-67890")

    def test_filter_by_usn_id(self):
        result = self.helper.filter_cve_data(
            self.cves,
            usn_ids=["3009-1"],
            binary_statuses=None,
            binary_versions=None,
            binary_fixed_versions=None,
            binary_names=None,
            cvss_severities=None,
            ubuntu_priorities=None,
        )
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["id"], "CVE-2023-12345")

    def test_filter_by_binary_name(self):
        result = self.helper.filter_cve_data(
            self.cves,
            usn_ids=None,
            binary_statuses=None,
            binary_versions=None,
            binary_fixed_versions=None,
            binary_names=["bash"],
            cvss_severities=None,
            ubuntu_priorities=None,
        )
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["id"], "CVE-2024-67890")

    def test_filter_by_binary_status(self):
        result = self.helper.filter_cve_data(
            self.cves,
            usn_ids=None,
            binary_statuses=["unfixed"],
            binary_versions=None,
            binary_fixed_versions=None,
            binary_names=None,
            cvss_severities=None,
            ubuntu_priorities=None,
        )
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["id"], "CVE-2023-12345")

    def test_filter_by_two_different_fields(self):
        result = self.helper.filter_cve_data(
            self.cves,
            usn_ids=["3010-2"],
            binary_statuses=None,
            binary_versions=None,
            binary_fixed_versions=None,
            binary_names=["bash"],
            cvss_severities=None,
            ubuntu_priorities=None,
        )
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["id"], "CVE-2024-67890")

    def test_filter_by_two_same_fields(self):
        result = self.helper.filter_cve_data(
            self.cves,
            usn_ids=None,
            binary_statuses=None,
            binary_versions=None,
            binary_fixed_versions=["1.2.4", "5.1"],
            binary_names=None,
            cvss_severities=None,
            ubuntu_priorities=None,
        )
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["id"], "CVE-2023-12345")
        self.assertEqual(result[1]["id"], "CVE-2024-67890")

    def test_no_matching_filters(self):
        result = self.helper.filter_cve_data(
            self.cves,
            usn_ids=["9999-9"],
            binary_statuses=None,
            binary_versions=None,
            binary_fixed_versions=None,
            binary_names=None,
            cvss_severities=None,
            ubuntu_priorities=None,
        )
        self.assertEqual(len(result), 0)
