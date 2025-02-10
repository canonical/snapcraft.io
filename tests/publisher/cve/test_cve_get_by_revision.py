import unittest
from unittest.mock import patch, MagicMock
import json
from webapp.publisher.cve.cve_helper import CveHelper
from werkzeug.exceptions import NotFound


class CveHGetByRevisionTest(unittest.TestCase):

    def setUp(self):
        self.helper = CveHelper()

        self.file_metadata = {"download_url": "https://example.com/file.json"}

        self.file_content = {
            "format": 1,
            "published_at": "2025-01-26T20:30:16+00:00",
            "security_issues": {
                "cves": {
                    "CVE-2023-31486": {
                        "cvss_score": 5.5,
                        "cvss_severity": "medium",
                        "description": "description-1",
                        "ubuntu_priority": "critical",
                    },
                    "CVE-2014-9984": {
                        "cvss_score": 9,
                        "cvss_severity": "high",
                        "description": "description-2",
                        "ubuntu_priority": "negligible",
                    },
                    "CVE-2024-52005": {
                        "cvss_score": 2.1,
                        "cvss_severity": "negligible",
                        "description": "description-3",
                        "ubuntu_priority": "medium",
                    },
                },
                "usns": {
                    "3009-1": {
                        "description": "USN description",
                        "published_at": "2016-06-20T16:35:09+00:00",
                        "related_cves": ["CVE-2014-9984"],
                        "related_launchpad_bugs": None,
                    }
                },
            },
            "snaps": {
                "my-snap": {
                    "revisions": {
                        "3053": {
                            "channels": ["edge"],
                            "fixed-cves": {
                                "CVE-2014-9984": {
                                    "affected_binaries": [
                                        {
                                            "fixed_version": "2.27-3ubuntu1.6",
                                            "name": "libc-dev-bin",
                                            "status": "fixed",
                                            "version": "2.27-3ubuntu1.4",
                                        },
                                        {
                                            "fixed_version": "2.27-3ubuntu1.6",
                                            "name": "libc6-dev",
                                            "status": "fixed",
                                            "version": "2.27-3ubuntu1.4",
                                        },
                                    ],
                                    "channels_with_fix": [],
                                    "usns": ["3009-1"],
                                },
                                "CVE-2023-31486": {
                                    "affected_binaries": [
                                        {
                                            "fixed_version": "2.27-3ubuntu1.6",
                                            "name": "libc-dev-bin21",
                                            "status": "fixed",
                                            "version": "2.27-3ubuntu1.4",
                                        },
                                    ],
                                    "channels_with_fix": [],
                                    "usns": ["3009-1"],
                                },
                            },
                            "unfixed-cves": {
                                "CVE-2024-52005": {
                                    "affected_binaries": [
                                        {
                                            "fixed_version": None,
                                            "name": "git-man",
                                            "status": "unfixed",
                                            "version": "1:2.34.1-1ubuntu1.12",
                                        }
                                    ],
                                    "channels_with_fix": None,
                                    "usns": None,
                                }
                            },
                        }
                    }
                }
            },
        }

    @patch("requests.get")
    def test_get_cve_by_revision(self, mock_get):
        mock_get.side_effect = [
            MagicMock(status_code=200, json=lambda: self.file_metadata),
            MagicMock(status_code=200, text=json.dumps(self.file_content)),
        ]

        result = self.helper.get_cve_with_revision("my-snap", "3053")

        self.assertEqual(len(result), 3)
        self.assertEqual(result[0]["id"], "CVE-2014-9984")
        self.assertEqual(result[0]["cvss_score"], 9)
        self.assertEqual(result[0]["cvss_severity"], "high")
        self.assertEqual(result[0]["description"], "description-2")
        self.assertEqual(result[0]["ubuntu_priority"], "negligible")
        self.assertEqual(len(result[0]["affected_binaries"]), 2)
        self.assertEqual(
            result[0]["affected_binaries"][0]["name"], "libc-dev-bin"
        )
        self.assertEqual(
            result[0]["affected_binaries"][1]["name"], "libc6-dev"
        )
        self.assertEqual(len(result[0]["usns"]), 1)
        self.assertEqual(result[0]["usns"][0]["id"], "3009-1")
        self.assertEqual(
            result[0]["usns"][0]["description"], "USN description"
        )

        self.assertEqual(result[1]["id"], "CVE-2023-31486")
        self.assertEqual(result[1]["cvss_score"], 5.5)
        self.assertEqual(result[1]["cvss_severity"], "medium")
        self.assertEqual(result[1]["description"], "description-1")
        self.assertEqual(result[1]["ubuntu_priority"], "critical")
        self.assertEqual(len(result[1]["affected_binaries"]), 1)
        self.assertEqual(
            result[1]["affected_binaries"][0]["name"], "libc-dev-bin21"
        )
        self.assertEqual(result[1]["affected_binaries"][0]["status"], "fixed")
        self.assertEqual(
            result[1]["affected_binaries"][0]["fixed_version"],
            "2.27-3ubuntu1.6",
        )
        self.assertEqual(
            result[1]["affected_binaries"][0]["version"], "2.27-3ubuntu1.4"
        )
        self.assertEqual(len(result[1]["usns"]), 1)
        self.assertEqual(result[1]["usns"][0]["id"], "3009-1")

        self.assertEqual(result[2]["id"], "CVE-2024-52005")
        self.assertEqual(result[2]["cvss_score"], 2.1)
        self.assertEqual(result[2]["cvss_severity"], "negligible")
        self.assertEqual(result[2]["description"], "description-3")
        self.assertEqual(result[2]["ubuntu_priority"], "medium")
        self.assertEqual(len(result[2]["affected_binaries"]), 1)
        self.assertEqual(result[2]["affected_binaries"][0]["name"], "git-man")
        self.assertEqual(
            result[2]["affected_binaries"][0]["status"], "unfixed"
        )
        self.assertEqual(
            result[2]["affected_binaries"][0]["fixed_version"], None
        )
        self.assertEqual(
            result[2]["affected_binaries"][0]["version"],
            "1:2.34.1-1ubuntu1.12",
        )
        self.assertEqual(len(result[2]["usns"]), 0)

    @patch("requests.get")
    def test_get_cve_by_revision_metadata_not_found(self, mock_get):
        mock_get.side_effect = [
            MagicMock(status_code=404, json=lambda: {}),
            MagicMock(status_code=200, text=json.dumps(self.file_content)),
        ]
        with self.assertRaises(NotFound):
            self.helper.get_cve_with_revision("my-snap", "3053")

    @patch("requests.get")
    def test_get_cve_by_revision_file_content_not_found(self, mock_get):
        mock_get.side_effect = [
            MagicMock(status_code=200, json=lambda: self.file_metadata),
            MagicMock(status_code=404, text=json.dumps(self.file_content)),
        ]
        with self.assertRaises(NotFound):
            self.helper.get_cve_with_revision("my-snap", "3053")
