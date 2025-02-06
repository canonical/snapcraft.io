import unittest
from unittest.mock import patch, MagicMock
import json
import flask

from webapp.publisher.cve.cve_helper import CveHelper

from werkzeug.exceptions import NotFound

mock_file_metadata = {"download_url": "https://example.com/file.json"}

mock_file_content = {
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
                                    "fixed_version": "2.27-3ubuntu1.6+esm1",
                                    "name": "libc-dev-bin",
                                    "status": "fixed",
                                    "version": "2.27-3ubuntu1.4",
                                },
                                {
                                    "fixed_version": "2.27-3ubuntu1.6+esm1",
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
                                    "fixed_version": "2.27-3ubuntu1.6+esm1",
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


class CveHelperTest(unittest.TestCase):
    @patch("requests.get")
    def test_get_cve_with_revision(self, mock_get):
        mock_get.side_effect = [
            MagicMock(status_code=200, json=lambda: mock_file_metadata),
            MagicMock(status_code=200, text=json.dumps(mock_file_content)),
        ]

        helper = CveHelper()
        result = helper.get_cve_with_revision("my-snap", "3053")
        # print(json.dumps(result, indent=2))

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
            "2.27-3ubuntu1.6+esm1",
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
    def test_get_cve_with_revision_metadata_not_found(self, mock_get):
        mock_get.side_effect = [
            MagicMock(status_code=404, json=lambda: {}),
            MagicMock(status_code=200, text=json.dumps(mock_file_content)),
        ]
        helper = CveHelper()
        with self.assertRaises(NotFound):
            helper.get_cve_with_revision("my-snap", "3053")

    @patch("requests.get")
    def test_get_cve_with_revision_file_content_not_found(self, mock_get):
        mock_get.side_effect = [
            MagicMock(status_code=200, json=lambda: mock_file_metadata),
            MagicMock(status_code=404, text=json.dumps(mock_file_content)),
        ]
        helper = CveHelper()
        with self.assertRaises(NotFound):
            helper.get_cve_with_revision("my-snap", "3053")

    def configure_user(
        self,
        mock_get_stores,
        mock_get_account,
        mock_get_snap_info,
        is_canonical_user,
        is_global_store,
        is_user_snap_publisher,
        is_collaborator,
        is_admin,
        is_snap_published_by_canonical,
    ):
        flask.session = {"publisher": {"is_canonical": is_canonical_user}}

        snap_publisher_info = {"id": "some-publisher", "username": "publisher"}
        if is_user_snap_publisher:
            snap_publisher_info = {"id": "some-user", "username": "user"}
        elif is_snap_published_by_canonical:
            snap_publisher_info = {"id": "canonical", "username": "canonical"}

        mock_get_snap_info.return_value = {
            "store": "Global" if is_global_store else "some-store",
            "publisher": snap_publisher_info,
        }

        mock_get_account.return_value = {
            "username": "user",
            "stores": ["Global" if is_global_store else "some-store"],
            "snaps": {"16": {"test-snap": {}} if is_collaborator else {}},
        }

        mock_get_stores.return_value = (
            [{"name": "some-store"}] if is_admin else []
        )

    @patch("webapp.publisher.cve.cve_helper.publisher_api.get_snap_info")
    @patch("webapp.publisher.cve.cve_helper.publisher_api.get_account")
    @patch("webapp.publisher.cve.cve_helper.logic.get_stores")
    def test_can_snap_publisher_access_cve_data(
        self, mock_get_stores, mock_get_account, mock_get_snap_info
    ):
        self.configure_user(
            is_admin=False,
            is_canonical_user=False,
            is_collaborator=True,
            is_global_store=False,
            is_user_snap_publisher=True,
            is_snap_published_by_canonical=False,
            mock_get_account=mock_get_account,
            mock_get_snap_info=mock_get_snap_info,
            mock_get_stores=mock_get_stores,
        )

        helper = CveHelper()
        result = helper.can_user_access_cve_data("test-snap")

        self.assertTrue(result)

    @patch("webapp.publisher.cve.cve_helper.publisher_api.get_snap_info")
    @patch("webapp.publisher.cve.cve_helper.publisher_api.get_account")
    @patch("webapp.publisher.cve.cve_helper.logic.get_stores")
    def test_can_admin_access_cve_data(
        self, mock_get_stores, mock_get_account, mock_get_snap_info
    ):
        self.configure_user(
            is_admin=True,
            is_canonical_user=False,
            is_collaborator=False,
            is_global_store=False,
            is_user_snap_publisher=False,
            is_snap_published_by_canonical=False,
            mock_get_account=mock_get_account,
            mock_get_snap_info=mock_get_snap_info,
            mock_get_stores=mock_get_stores,
        )

        helper = CveHelper()
        result = helper.can_user_access_cve_data("test-snap")

        self.assertTrue(result)

    @patch("webapp.publisher.cve.cve_helper.publisher_api.get_snap_info")
    @patch("webapp.publisher.cve.cve_helper.publisher_api.get_account")
    @patch("webapp.publisher.cve.cve_helper.logic.get_stores")
    def test_can_canonical_publisher_access_cve_data_of_global_canonical_snap(
        self, mock_get_stores, mock_get_account, mock_get_snap_info
    ):
        self.configure_user(
            is_admin=False,
            is_canonical_user=True,
            is_collaborator=False,
            is_global_store=True,
            is_user_snap_publisher=False,
            is_snap_published_by_canonical=True,
            mock_get_account=mock_get_account,
            mock_get_snap_info=mock_get_snap_info,
            mock_get_stores=mock_get_stores,
        )

        helper = CveHelper()
        result = helper.can_user_access_cve_data("test-snap")

        self.assertTrue(result)

    @patch("webapp.publisher.cve.cve_helper.publisher_api.get_snap_info")
    @patch("webapp.publisher.cve.cve_helper.publisher_api.get_account")
    @patch("webapp.publisher.cve.cve_helper.logic.get_stores")
    def test_can_collaborator_access_cve_data_of_global_snap(
        self, mock_get_stores, mock_get_account, mock_get_snap_info
    ):
        self.configure_user(
            is_admin=False,
            is_canonical_user=False,
            is_collaborator=True,
            is_global_store=True,
            is_user_snap_publisher=False,
            is_snap_published_by_canonical=False,
            mock_get_account=mock_get_account,
            mock_get_snap_info=mock_get_snap_info,
            mock_get_stores=mock_get_stores,
        )

        helper = CveHelper()
        result = helper.can_user_access_cve_data("test-snap")

        self.assertTrue(result)

    @patch("webapp.publisher.cve.cve_helper.publisher_api.get_snap_info")
    @patch("webapp.publisher.cve.cve_helper.publisher_api.get_account")
    @patch("webapp.publisher.cve.cve_helper.logic.get_stores")
    def test_non_collab_publisher_user_fail_access_cve_data_of_global_snap(
        self, mock_get_stores, mock_get_account, mock_get_snap_info
    ):
        self.configure_user(
            is_admin=False,
            is_canonical_user=False,
            is_collaborator=False,
            is_global_store=True,
            is_user_snap_publisher=False,
            is_snap_published_by_canonical=False,
            mock_get_account=mock_get_account,
            mock_get_snap_info=mock_get_snap_info,
            mock_get_stores=mock_get_stores,
        )

        helper = CveHelper()
        result = helper.can_user_access_cve_data("test-snap")

        self.assertFalse(result)

    @patch("webapp.publisher.cve.cve_helper.publisher_api.get_snap_info")
    @patch("webapp.publisher.cve.cve_helper.publisher_api.get_account")
    @patch("webapp.publisher.cve.cve_helper.logic.get_stores")
    def test_non_collab_publisher_user_fail_access_cve_data_of_brand_snap(
        self, mock_get_stores, mock_get_account, mock_get_snap_info
    ):
        self.configure_user(
            is_admin=False,
            is_canonical_user=False,
            is_collaborator=False,
            is_global_store=False,
            is_user_snap_publisher=False,
            is_snap_published_by_canonical=False,
            mock_get_account=mock_get_account,
            mock_get_snap_info=mock_get_snap_info,
            mock_get_stores=mock_get_stores,
        )

        helper = CveHelper()
        result = helper.can_user_access_cve_data("test-snap")

        self.assertFalse(result)
