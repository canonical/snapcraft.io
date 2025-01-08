from unittest.mock import Mock, patch
from tests.admin.tests_models import TestModelServiceEndpoints
from canonicalwebteam.store_api.exceptions import StoreApiResponseErrorList


class TestGetSigningKeys(TestModelServiceEndpoints):
    @patch("webapp.admin.views.admin_api.get_store_signing_keys")
    def test_get_signing_keys(self, mock_get_store_signing_keys):
        mock_get_store_signing_keys.return_value = [
            {"sha3-384": "key1"},
            {"sha3-384": "key2"},
        ]

        response = self.client.get("/api/store/1/signing-keys")
        data = response.json

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertEqual(
            data["data"],
            [{"sha3-384": "key1"}, {"sha3-384": "key2"}],
        )

    @patch("webapp.admin.views.admin_api.get_store_signing_keys")
    def test_failed_get_signing_keys(self, mock_get_store_signing_keys):
        mock_get_store_signing_keys.side_effect = StoreApiResponseErrorList(
            "error", 502, [{"message": "An error occurred"}]
        )

        response = self.client.get("/api/store/1/signing-keys")
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "An error occurred")


class TestCreateSigningKeys(TestModelServiceEndpoints):
    @patch("webapp.admin.views.admin_api.create_store_signing_key")
    def test_create_signing_key(self, mock_create_store_signing_key):
        mock_create_store_signing_key.return_value = None

        payload = {"name": "test_signing_key"}
        response = self.client.post(
            "/api/store/1/signing-keys",
            data=payload,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json
        self.assertTrue(data["success"])

    def test_name_too_long_create_signing_key(self):
        payload = {"name": "random name" * 12}
        response = self.client.post("/api/store/1/signing-keys", data=payload)
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(
            data["message"],
            "Invalid signing key. Limit 128 characters",
        )

    @patch("webapp.admin.views.admin_api.create_store_signing_key")
    def test_exception_in_create_signing_key(
        self,
        mock_create_store_signing_key,
    ):
        mock_create_store_signing_key.side_effect = StoreApiResponseErrorList(
            "An error occurred", 500, [{"message": "An error occurred"}]
        )

        payload = {"name": "test_signing_key"}
        response = self.client.post(
            "/api/store/1/signing-keys",
            data=payload,
        )
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "An error occurred")


class TestDeleteSigningKeys(TestModelServiceEndpoints):
    @patch("webapp.admin.views.admin_api.delete_store_signing_key")
    def test_successful_delete_signing_key(
        self,
        mock_delete_store_signing_key,
    ):
        mock_delete_store_signing_key.return_value = Mock(status_code=204)

        response = self.client.delete(
            "/api/store/1/signing-keys/signing_key_sha3_384"
        )
        data = response.json

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])

    @patch("webapp.admin.views.admin_api.delete_store_signing_key")
    @patch("webapp.admin.views.admin_api.get_store_models")
    @patch("webapp.admin.views.admin_api.get_store_model_policies")
    def test_signing_key_in_use(
        self, mock_get_policies, mock_get_models, mock_delete_store_signing_key
    ):
        mock_delete_store_signing_key.side_effect = StoreApiResponseErrorList(
            "Signing key is in use",
            409,
            [{"message": "key used to sign at least one serial policy"}],
        )
        mock_get_models.return_value = [{"name": "Model1"}]
        mock_get_policies.return_value = [
            {"revision": "1", "signing-key-sha3-384": "valid_key"}
        ]

        response = self.client.delete("/api/store/1/signing-keys/valid_key")
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertEqual(
            data["message"],
            "Signing key is used in at least one policy",
        )
        self.assertEqual(
            data["data"]["models"],
            [{"name": "Model1", "policies": [{"revision": "1"}]}],
        )

    @patch("webapp.admin.views.admin_api.delete_store_signing_key")
    def test_signing_key_not_found(self, mock_delete_store_signing_key):
        mock_delete_store_signing_key.return_value = Mock(status_code=404)

        response = self.client.delete("/api/store/1/signing-keys/invalid_key")
        data = response.json

        self.assertEqual(response.status_code, 404)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "Signing key not found")
