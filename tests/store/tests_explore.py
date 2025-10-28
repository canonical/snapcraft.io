import unittest
from unittest.mock import patch, Mock
import requests


class ExploreViewTest(unittest.TestCase):
    def setUp(self):
        self.recommendations_url = (
            "https://recommendations.snapcraft.io/api/category"
        )

        self.mock_snaps = [
            {
                "details": {
                    "contact": "https://example.com/contact",
                    "description": "Test description",
                    "icon": "https://example.com/icon.png",
                    "links": {
                        "contact": ["https://example.com/contact"],
                        "website": ["https://example.com"],
                    },
                    "name": "test-snap",
                    "publisher": "Canonical",
                    "title": "Test snap",
                },
                "snap_id": "test-snap-id",
            }
        ]

    @patch("requests.get")
    def test_popular_snaps(self, mock_requests_get):
        mock_response = Mock()
        mock_response.json.return_value = self.mock_snaps
        mock_requests_get.return_value = mock_response

        res = requests.get(f"{self.recommendations_url}/popular")
        popular_snaps = res.json()

        self.assertEqual(popular_snaps, self.mock_snaps)

    @patch("requests.get")
    def test_recent_snaps(self, mock_requests_get):
        mock_response = Mock()
        mock_response.json.return_value = self.mock_snaps
        mock_requests_get.return_value = mock_response

        res = requests.get(f"{self.recommendations_url}/recent")
        recent_snaps = res.json()

        self.assertEqual(recent_snaps, self.mock_snaps)

    @patch("requests.get")
    def test_trending_snaps(self, mock_requests_get):
        mock_response = Mock()
        mock_response.json.return_value = self.mock_snaps
        mock_requests_get.return_value = mock_response

        res = requests.get(f"{self.recommendations_url}/trending")
        trending_snaps = res.json()

        self.assertEqual(trending_snaps, self.mock_snaps)
