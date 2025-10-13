import unittest
import xml.etree.ElementTree as ET
from unittest.mock import patch, Mock
from webapp.app import create_app


class TestFeeds(unittest.TestCase):
    def setUp(self):
        self.app = create_app(testing=True)
        self.client = self.app.test_client()

    @patch("webapp.feeds.feeds.session.get")
    def test_feeds_updates_success(self, mock_get):
        """Test successful RSS feed generation using feedgen"""
        mock_response = Mock()
        mock_response.json.return_value = {
            "page": 1,
            "size": 2,
            "snaps": [
                {
                    "name": "test-snap",
                    "title": "Test Snap",
                    "summary": "A test snap",
                    "publisher": "Test Publisher",
                    "license": "MIT",
                    "version": "1.0.0",
                    "last_updated": "Thu, 02 Oct 2025 22:07:58 GMT",
                    "icon": "https://example.com/icon.png",
                    "snap_id": "test-snap-id-123",
                    "media": [
                        {
                            "type": "screenshot",
                            "url": "https://example.com/screenshot.png",
                        }
                    ],
                }
            ],
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        response = self.client.get("/feeds/updates")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.content_type, "application/rss+xml; charset=utf-8"
        )
        content = response.get_data(as_text=True)
        self.assertIn("<?xml version='1.0' encoding='UTF-8'?>", content)
        self.assertIn(
            "<title>Snapcraft - recently updated snaps</title>", content
        )

        try:
            root = ET.fromstring(content)
        except ET.ParseError as e:
            self.fail(f"Returned content is not valid XML: {e}")

        self.assertEqual(root.tag, "rss")
        channel = root.find("channel")
        self.assertIsNotNone(channel, "No <channel> element found in RSS feed")

        items = channel.findall("item")
        self.assertTrue(
            any(item.findtext("title") == "Test Snap" for item in items)
        )
        self.assertIn("<description>", content)
        self.assertIn("Test Publisher", content)
        self.assertIn("https://snapcraft.io/test-snap", content)


if __name__ == "__main__":
    unittest.main()
