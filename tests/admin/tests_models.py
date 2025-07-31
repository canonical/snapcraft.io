from unittest.mock import patch

from canonicalwebteam.candid import CandidClient
from canonicalwebteam.exceptions import (
    StoreApiResourceNotFound,
)
from webapp.helpers import api_publisher_session
from tests.admin.admin_endpoint_testing import TestAdminEndpoints


candid = CandidClient(api_publisher_session)


class TestModelServiceEndpoints(TestAdminEndpoints):
    def setUp(self):
        self.api_key = "qwertyuioplkjhgfdsazxcvbnmkiopuytrewqasdfghjklmnbv"
        self.mock_get_store = patch(
            "webapp.admin.views.dashboard.get_store"
        ).start()
        super().setUp()


class TestCreateModel(TestModelServiceEndpoints):
    @patch(
        "canonicalwebteam.store_api.publishergw.PublisherGW.create_store_model"
    )
    def test_create_model(self, mock_create_store_model):
        mock_create_store_model.return_value = None

        payload = {"name": "Test Model", "api_key": self.api_key}
        response = self.client.post("/api/store/1/models", data=payload)
        data = response.json

        self.assertEqual(response.status_code, 201)
        self.assertTrue(data["success"])

    def test_create_model_with_invalid_api_key(self):
        payload = {"name": "Test Model", "api_key": "invalid_api_key"}
        response = self.client.post("/api/store/1/models", data=payload)
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertIn("Invalid API key", data["message"])

    def test_name_too_long(self):
        payload = {"name": "some_random_long_name" * 7}
        response = self.client.post("/api/store/1/models", data=payload)
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(
            data["message"], "Name is too long. Limit 128 characters"
        )

    def test_missing_name(self):
        payload = {"api_key": self.api_key}
        response = self.client.post("/api/store/1/models", data=payload)
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "An error occurred")


class TestUpdateModel(TestModelServiceEndpoints):
    @patch(
        "canonicalwebteam.store_api.publishergw.PublisherGW.update_store_model"
    )
    def test_update_model(self, mock_update_store_model):
        mock_update_store_model.return_value = None

        payload = {"api_key": self.api_key}
        response = self.client.patch(
            "/api/store/1/models/Model1", data=payload
        )
        data = response.json

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])

    def test_update_model_with_invalid_api_key(self):
        payload = {"api_key": "invalid_api_key"}
        response = self.client.patch(
            "/api/store/1/models/Model1", data=payload
        )
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "Invalid API key")

    @patch(
        "canonicalwebteam.store_api.publishergw.PublisherGW.update_store_model"
    )
    def test_model_not_found(self, mock_update_store_model):
        mock_update_store_model.side_effect = StoreApiResourceNotFound(
            "Model not found", 404, [{"message": "Model not found"}]
        )

        payload = {"api_key": self.api_key}
        response = self.client.patch(
            "/api/store/1/models/Model1", data=payload
        )
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "Model not found")
