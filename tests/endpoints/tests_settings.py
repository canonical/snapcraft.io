from unittest.mock import patch
from tests.endpoints.endpoint_testing import TestEndpoints


class TestPostSettings(TestEndpoints):
    @patch(
        "canonicalwebteam.store_api.dashboard.Dashboard.change_store_settings"
    )
    def test_post_settings_success(self, mock_change_store_settings):
        mock_change_store_settings.return_value = None

        payload = {
            "private": "true",
            "manual-review-policy": "allow-new-snap-names",
        }
        response = self.client.put("/api/store/1/settings", data=payload)
        data = response.json

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])

    @patch(
        "canonicalwebteam.store_api.dashboard.Dashboard.change_store_settings"
    )
    def test_post_settings_with_false_private(
        self, mock_change_store_settings
    ):
        mock_change_store_settings.return_value = None

        payload = {
            "private": "false",
            "manual-review-policy": "reject-new-snap-names",
        }
        response = self.client.put("/api/store/1/settings", data=payload)
        data = response.json

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])

        call_args = mock_change_store_settings.call_args
        settings = call_args[0][2]
        self.assertFalse(settings["private"])
        self.assertEqual(
            settings["manual-review-policy"], "reject-new-snap-names"
        )

    @patch(
        "canonicalwebteam.store_api.dashboard.Dashboard.change_store_settings"
    )
    def test_post_settings_minimal_payload(self, mock_change_store_settings):
        mock_change_store_settings.return_value = None

        payload = {"private": "false"}
        response = self.client.put("/api/store/1/settings", data=payload)
        data = response.json

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])

        call_args = mock_change_store_settings.call_args
        settings = call_args[0][2]
        self.assertFalse(settings["private"])
        self.assertIsNone(settings["manual-review-policy"])
