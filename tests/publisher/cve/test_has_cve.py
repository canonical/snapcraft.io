import unittest
from unittest.mock import patch

from webapp.publisher.cve.cve_helper import CveHelper
from werkzeug.exceptions import NotFound


class HasRevisionsWithCvesTest(unittest.TestCase):

    @patch("webapp.publisher.cve.cve_helper.CveHelper._get_cve_file_metadata")
    def test_returns_revision_numbers(self, mock_get_metadata):
        mock_get_metadata.return_value = [
            {"name": "123.yaml"},
            {"name": "456.yaml"},
            {"name": "789.yaml"},
        ]

        result = CveHelper.has_revisions_with_cves("my-snap")
        self.assertEqual(result, [123, 456, 789])

    @patch("webapp.publisher.cve.cve_helper.CveHelper._get_cve_file_metadata")
    def test_ignores_non_yaml_files(self, mock_get_metadata):
        mock_get_metadata.return_value = [
            {"name": "README.md"},
            {"name": "123.yaml"},
            {"name": "abc.yaml"},
            {"name": "456.yaml"},
            {"name": "data.txt"},
        ]

        result = CveHelper.has_revisions_with_cves("my-snap")
        self.assertEqual(result, [123, 456])

    @patch("webapp.publisher.cve.cve_helper.CveHelper._get_cve_file_metadata")
    def test_returns_empty_list_if_no_revision_files(self, mock_get_metadata):
        mock_get_metadata.return_value = [
            {"name": "README.md"},
            {"name": "notes.txt"},
        ]

        result = CveHelper.has_revisions_with_cves("my-snap")
        self.assertEqual(result, [])

    @patch("webapp.publisher.cve.cve_helper.CveHelper._get_cve_file_metadata")
    def test_returns_empty_list_on_not_found(self, mock_get_metadata):
        mock_get_metadata.side_effect = NotFound()

        result = CveHelper.has_revisions_with_cves("my-snap")
        self.assertEqual(result, [])
