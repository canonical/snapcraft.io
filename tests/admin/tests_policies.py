from unittest.mock import Mock, patch
from canonicalwebteam.exceptions import StoreApiResponseErrorList

from tests.admin.tests_models import TestModelServiceEndpoints


class TestGetPolicies(TestModelServiceEndpoints):
    @patch(
        "canonicalwebteam.store_api.publishergw."
        "PublisherGW.get_store_model_policies"
    )
    def test_get_policies(self, mock_get_store_model_policies):
        mock_get_store_model_policies.return_value = ["policy1", "policy2"]

        response = self.client.get("/api/store/1/models/Model1/policies")
        data = response.json

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])
        self.assertEqual(data["data"], ["policy1", "policy2"])

    @patch(
        "canonicalwebteam.store_api.publishergw."
        "PublisherGW.get_store_model_policies"
    )
    def test_failed_get_policies(self, mock_get_store_model_policies):
        mock_get_store_model_policies.side_effect = StoreApiResponseErrorList(
            "An error occurred", 500, [{"message": "An error occurred"}]
        )

        response = self.client.get("/api/store/1/models/Model1/policies")
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "An error occurred")


class TestCreatePolicies(TestModelServiceEndpoints):
    @patch(
        "canonicalwebteam.store_api.publishergw."
        "PublisherGW.get_store_signing_keys"
    )
    @patch(
        "canonicalwebteam.store_api.publishergw."
        "PublisherGW.create_store_model_policy"
    )
    def test_create_policy(
        self, mock_create_store_model_policy, mock_get_store_signing_keys
    ):
        mock_get_store_signing_keys.return_value = [
            {"sha3-384": "valid_signing_key"}
        ]
        mock_create_store_model_policy.return_value = None

        payload = {"signing_key": "valid_signing_key"}
        response = self.client.post(
            "/api/store/1/models/Model1/policies", data=payload
        )
        data = response.json

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])

    @patch(
        "canonicalwebteam.store_api.publishergw."
        "PublisherGW.get_store_signing_keys"
    )
    def test_missing_signing_key(self, mock_get_store_signing_keys):
        mock_get_store_signing_keys.return_value = [
            {"sha3-384": "valid_signing_key"}
        ]

        payload = {}
        response = self.client.post(
            "/api/store/1/models/Model1/policies", data=payload
        )
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "Signing key required")

    @patch(
        "canonicalwebteam.store_api.publishergw."
        "PublisherGW.get_store_signing_keys"
    )
    def test_invalid_signing_key(self, mock_get_store_signing_keys):
        mock_get_store_signing_keys.return_value = [{"sha3-384": "valid_key"}]

        payload = {"signing_key": "invalid_key"}
        response = self.client.post(
            "/api/store/1/models/Model1/policies", data=payload
        )
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "Invalid signing key")

    @patch(
        "canonicalwebteam.store_api.publishergw."
        "PublisherGW.get_store_signing_keys"
    )
    @patch(
        "canonicalwebteam.store_api.publishergw."
        "PublisherGW.create_store_model_policy"
    )
    def test_exception_in_create_policy(
        self,
        mock_create_store_model_policy,
        mock_get_store_signing_keys,
    ):
        mock_get_store_signing_keys.return_value = [{"sha3-384": "valid_key"}]
        mock_create_store_model_policy.side_effect = StoreApiResponseErrorList(
            "Simulated failure", 500, [{"message": "An error occurred"}]
        )

        payload = {"signing_key": "valid_key"}
        response = self.client.post(
            "/api/store/1/models/Model1/policies", data=payload
        )
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "An error occurred")


class TestDeletePolicies(TestModelServiceEndpoints):
    @patch(
        "canonicalwebteam.store_api.publishergw."
        "PublisherGW.delete_store_model_policy"
    )
    def test_successful_delete_policy(self, mock_delete_store_model_policy):
        mock_delete_store_model_policy.return_value = Mock(status_code=204)

        response = self.client.delete("/api/store/1/models/Model1/policies/1")
        data = response.json

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])

    @patch(
        "canonicalwebteam.store_api.publishergw."
        "PublisherGW.delete_store_model_policy"
    )
    def test_policy_not_found(self, mock_delete_store_model_policy):
        mock_delete_store_model_policy.return_value = Mock(status_code=404)

        response = self.client.delete("/api/store/1/models/Model1/policies/1")
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "Policy not found")

    @patch(
        "canonicalwebteam.store_api.publishergw."
        "PublisherGW.delete_store_model_policy"
    )
    def test_exception_in_delete_policy(self, mock_delete_store_model_policy):
        mock_delete_store_model_policy.side_effect = StoreApiResponseErrorList(
            "An error occured", 500, [{"message": "An error occurred"}]
        )

        response = self.client.delete("/api/store/1/models/Model1/policies/1")
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "An error occurred")
