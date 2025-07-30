import json
from json import dumps as _dumps
from unittest.mock import MagicMock, patch
from tests.endpoints.endpoint_testing import TestEndpoints


class TestGetStore(TestEndpoints):
    @patch("canonicalwebteam.store_api.dashboard.Dashboard.get_store")
    def test_get_store(self, mock_get_store):
        def dumps_wrapper(*args, **kwargs):
            return _dumps(
                *args,
                **(kwargs | {"default": lambda obj: json.dumps(test_store)})
            )

        json.dumps = MagicMock(wraps=dumps_wrapper)

        test_store = {
            "allowed-inclusion-source-stores": [],
            "allowed-inclusion-target-stores": [],
            "brand-id": "test-brand-id",
            "id": "test-id",
            "manual-review-policy": "avoid",
            "name": "Test Store",
            "parent": None,
            "private": False,
            "roles": [
                {
                    "description": "Admin's manage the store users",
                    "label": "Admin",
                    "role": "admin",
                }
            ],
            "snap-name-prefixes": [],
            "store-whitelist": [],
        }

        mock_get_store.return_value = test_store

        response = self.client.get("/api/store/test-store-id")
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertEqual(
            data["data"],
            json.dumps(
                {
                    "allowed-inclusion-source-stores": [],
                    "allowed-inclusion-target-stores": [],
                    "brand-id": "test-brand-id",
                    "id": "test-id",
                    "manual-review-policy": "avoid",
                    "name": "Test Store",
                    "parent": None,
                    "private": False,
                    "roles": [
                        {
                            "description": "Admin's manage the store users",
                            "label": "Admin",
                            "role": "admin",
                        }
                    ],
                    "snap-name-prefixes": [],
                    "store-whitelist": [],
                }
            ),
        )
