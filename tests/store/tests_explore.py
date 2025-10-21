import unittest
from unittest.mock import patch, Mock


class ExploreViewTest(unittest.TestCase):
    def setUp(self):
        self.recommendations_url = (
            "https://recommendations.snapcraft.io/api/category/popular"
        )

    @patch("requests.get")
    def test_recommendations_api_call(self, mock_requests_get):
        mock_popular_snaps = [
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
        mock_response = Mock()
        mock_response.json.return_value = mock_popular_snaps
        mock_requests_get.return_value = mock_response

        import requests

        r = requests.get(
            "https://recommendations.snapcraft.io/api/category/popular"
        )
        popular_snaps = r.json()

        self.assertEqual(popular_snaps, mock_popular_snaps)
