from unittest.mock import patch
from tests.admin.tests_models import TestModelServiceEndpoints
from canonicalwebteam.store_api.exceptions import (
    StoreApiResponseErrorList,
    StoreApiResourceNotFound,
)


class TestGetPolicies(TestModelServiceEndpoints):

    @patch('webapp.admin.views.admin_api.get_store_model_policies')
    def test_get_policies(self, mock_get_store_model_policies):
        mock_get_store_model_policies.return_value = ["policy1", "policy2"]
        response = self.client.get('/admin/store/1/models/Model1/policies')
        data = response.json

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['success'])
        self.assertEqual(data['data'], ["policy1", "policy2"])

    @patch('webapp.admin.views.admin_api.get_store_model_policies')
    def test_failed_get_policies(self, mock_get_store_model_policies):
        mock_get_store_model_policies.side_effect = StoreApiResponseErrorList('An error occurred', 500, [{'message': 'An error occurred'}])

        response = self.client.get('/admin/store/1/models/Model1/policies')
        self.assertEqual(response.status_code, 500)
        data = response.get_json()
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'An error occurred')

    @patch("webapp.admin.views.admin_api.get_store_model_policies")
    def test_model_not_found(self, mock_get_store_model_policies):
        mock_get_store_model_policies.side_effect = StoreApiResourceNotFound(
            "Model not found",
            404,
            [{"message": "Model not found"}]
        )
        payload = {"api_key": self.api_key}
        response = self.client.patch("/admin/store/1/models/Model1", data=payload)
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "Model not found")

class TestCreatePolicies(TestModelServiceEndpoints):

    @patch('webapp.admin.views.admin_api.get_store_signing_keys')
    @patch('webapp.admin.views.admin_api.create_store_model_policy')
    def test_create_policy(self, mock_create_store_model_policy, mock_get_store_signing_keys):
        mock_get_store_signing_keys.return_value = [{"sha3-384": "valid_signing_key"}]
        mock_create_store_model_policy.return_value = None

        payload = {'signing_key': 'valid_signing_key'}
        response = self.client.post('/admin/store/1/models/Model1/policies', data=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])

    
    @patch('webapp.admin.views.admin_api.get_store_signing_keys')
    def test_missing_signing_key(self, mock_get_store_signing_keys):
        mock_get_store_signing_keys.return_value = [{"sha3-384": "valid_signing_key"}]

        payload = {}
        response = self.client.post('/admin/store/1/models/Model1/policies', data=payload)
        data = response.get_json()

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'Signing key required')

    @patch('webapp.admin.views.admin_api.get_store_signing_keys')
    @patch('webapp.admin.views.admin_api.create_store_model_policy')
    def test_invalid_signing_key(self, mock_create_store_model_policy, mock_get_store_signing_keys):
        mock_get_store_signing_keys.return_value = [{"sha3-384": "valid_key"}]

        payload = {'signing_key': 'invalid_key'}
        response = self.client.post('/admin/store/1/models/Model1/policies', data=payload)
        data = response.get_json()

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'Invalid signing key')

    @patch('webapp.admin.views.admin_api.get_store_signing_keys')
    @patch('webapp.admin.views.admin_api.create_store_model_policy')
    def test_exception_in_create_policy(self, mock_create_store_model_policy, mock_get_store_signing_keys):
        mock_get_store_signing_keys.return_value = [{"sha3-384": "valid_key"}]

        mock_create_store_model_policy.side_effect = StoreApiResponseErrorList("Simulated failure", 500, [{"message": "An error occurred"}])

        payload = {'signing_key': 'valid_key'}
        response = self.client.post('/admin/store/1/models/Model1/policies', data=payload)
        self.assertEqual(response.status_code, 500)
        data = response.get_json()
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'An error occurred')

class TestDeletePolicies(TestModelServiceEndpoints):
    pass