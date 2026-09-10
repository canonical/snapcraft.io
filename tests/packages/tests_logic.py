import unittest
from unittest.mock import patch

from webapp.packages.logic import extract_publisher, fetch_packages


class TestExtractPublisher(unittest.TestCase):
    def test_publisher_only_query(self):
        publisher, query = extract_publisher("publisher:snapcrafters")
        self.assertEqual(publisher, "snapcrafters")
        self.assertEqual(query, "")

    def test_publisher_with_text_query(self):
        publisher, query = extract_publisher("publisher:snapcrafters terminal")
        self.assertEqual(publisher, "snapcrafters")
        self.assertEqual(query, "terminal")

    def test_no_publisher_term(self):
        publisher, query = extract_publisher("terminal emulator")
        self.assertIsNone(publisher)
        self.assertEqual(query, "terminal emulator")

    def test_prefix_is_case_insensitive(self):
        publisher, query = extract_publisher("Publisher:snapcrafters")
        self.assertEqual(publisher, "snapcrafters")
        self.assertEqual(query, "")

    def test_empty_publisher_value_is_kept_as_text(self):
        publisher, query = extract_publisher("publisher:")
        self.assertIsNone(publisher)
        self.assertEqual(query, "publisher:")

    def test_colon_in_other_terms_is_untouched(self):
        publisher, query = extract_publisher("category:games chess")
        self.assertIsNone(publisher)
        self.assertEqual(query, "category:games chess")

    def test_empty_query(self):
        publisher, query = extract_publisher("")
        self.assertIsNone(publisher)
        self.assertEqual(query, "")


class TestFetchPackagesPublisherFilter(unittest.TestCase):
    @patch("webapp.packages.logic.device_gateway")
    def test_publisher_term_is_passed_as_filter(self, mock_device_gateway):
        mock_device_gateway.find.return_value = {"results": []}

        fetch_packages(["title"], {"q": "publisher:snapcrafters"})

        _, kwargs = mock_device_gateway.find.call_args
        self.assertEqual(kwargs["publisher"], "snapcrafters")
        self.assertEqual(kwargs["query"], "")

    @patch("webapp.packages.logic.device_gateway")
    def test_plain_query_has_no_publisher_filter(self, mock_device_gateway):
        mock_device_gateway.find.return_value = {"results": []}

        fetch_packages(["title"], {"q": "terminal"})

        _, kwargs = mock_device_gateway.find.call_args
        self.assertNotIn("publisher", kwargs)
        self.assertEqual(kwargs["query"], "terminal")


if __name__ == "__main__":
    unittest.main()
