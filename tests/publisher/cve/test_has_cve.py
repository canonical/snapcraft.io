import unittest
from unittest.mock import patch, MagicMock

from webapp.publisher.cve.cve_helper import CveHelper
from werkzeug.exceptions import NotFound


class HasCvesTest(unittest.TestCase):

    def setUp(self):
        self.file_metadata = {"download_url": "https://example.com/file.json"}

    @patch("requests.get")
    def test_has_cve_data(self, mock_get):
        mock_get.side_effect = [
            MagicMock(status_code=200, json=lambda: self.file_metadata),
        ]

        result = CveHelper.has_cve_data("my-snap")

        self.assertEqual(result, True)

    @patch("requests.get")
    def test_has_cve_data_not_found(self, mock_get):
        mock_get.side_effect = [
            MagicMock(status_code=404, json=lambda: {}),
        ]

        with self.assertRaises(NotFound):
            CveHelper.has_cve_data("my-snap")
