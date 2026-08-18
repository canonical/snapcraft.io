from unittest.mock import patch

from tests.endpoints.endpoint_testing import TestEndpoints


class TestSnapPermissionsEndpoint(TestEndpoints):
    def _url(self, query=""):
        base_url = "/api/mumble/permissions"
        return f"{base_url}?{query}" if query else base_url

    def test_missing_channel_parameter_returns_400(self):
        response = self.client.get(self._url("architecture=amd64"))
        data = response.get_json()

        self.assertEqual(response.status_code, 400)
        self.assertEqual(data["success"], False)
        self.assertEqual(data["errors"], ['"channel" parameter is required'])

    def test_missing_architecture_parameter_returns_400(self):
        response = self.client.get(self._url("channel=latest/stable"))
        data = response.get_json()

        self.assertEqual(response.status_code, 400)
        self.assertEqual(data["success"], False)
        self.assertEqual(
            data["errors"], ['"architecture" parameter is required']
        )

    @patch("webapp.endpoints.snaps.device_gateway.get_item_details")
    def test_returns_confinement_and_interfaces(self, mock_get_item_details):
        mock_get_item_details.return_value = {
            "channel-map": [
                {
                    "channel": {
                        "name": "latest/stable",
                        "architecture": "amd64",
                    },
                    "snap-yaml": (
                        "confinement: strict\n"
                        "plugs:\n"
                        "  network:\n"
                        "    interface: network\n"
                        "  home:\n"
                        "    interface: home\n"
                    ),
                }
            ]
        }

        response = self.client.get(
            self._url("channel=latest/stable&architecture=amd64")
        )
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["confinement"], "strict")
        self.assertEqual(
            data["data"]["interfaces"],
            [
                {"name": "network", "interface": "network"},
                {"name": "home", "interface": "home"},
            ],
        )

        mock_get_item_details.assert_called_once_with(
            "mumble", api_version=2, fields=["snap-yaml"]
        )

    @patch("webapp.endpoints.snaps.device_gateway.get_item_details")
    def test_returns_errors_when_snap_yaml_parsing_fails(
        self, mock_get_item_details
    ):
        mock_get_item_details.return_value = {
            "channel-map": [
                {
                    "channel": {
                        "name": "latest/stable",
                        "architecture": "amd64",
                    },
                    "snap-yaml": "plugs: [",
                }
            ]
        }

        response = self.client.get(
            self._url("channel=latest/stable&architecture=amd64")
        )
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertIn("errors", data)
        self.assertEqual(len(data["errors"]), 1)
        self.assertIsInstance(data["errors"][0], str)

    @patch("webapp.endpoints.snaps.device_gateway.get_item_details")
    def test_returns_unsuccessful_response_when_details_fetch_fails(
        self, mock_get_item_details
    ):
        mock_get_item_details.side_effect = Exception("store API error")

        response = self.client.get(
            self._url("channel=latest/stable&architecture=amd64")
        )
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertFalse(data["success"])
        self.assertEqual(data["errors"], ["store API error"])
