import unittest
from unittest.mock import patch

from canonicalwebteam.candid import CandidClient
from canonicalwebteam.store_api.exceptions import (
    StoreApiResponseErrorList,
    StoreApiResourceNotFound,
)
from webapp.app import create_app
from webapp.helpers import api_publisher_session


candid = CandidClient(api_publisher_session)


class TestModelServiceEndpoints(unittest.TestCase):

    def _candid_log_in(self, client):
        """Emulates test client login in the store.

        Fill current session with `openid`, `macaroon_root` and
        `macaroon_discharge`.

        Return the expected `Authorization` header for further verification
        in API requests.
        """
        
        test_macaroon = "AgEQYXBpLnNuYXBjcmFmdC5pbwImAwoQUWyZ4S4wHL6zykGguk4n-RIBMBoOCgVsb2dpbhIFbG9naW4AAid0aW1lLWJlZm9yZSAyMDI0LTA3LTEwVDEzOjMyOjA4LjUxMzE0OFoAAiZ0aW1lLXNpbmNlIDIwMjMtMDctMTFUMTM6MzI6MDguNTEzMTQ4WgACL3Nlc3Npb24taWQgZWI2YWQyOGItMjAxOS00ZjA3LThmOTMtNTRlMTQzODExMWUwAAI5ZGVjbGFyZWQgdXNlcmlkIHVzc286aHR0cHM6Ly9sb2dpbi51YnVudHUuY29tLytpZC9uNnp0Y3lMAAIZZXh0cmEgeyJwZXJtaXNzaW9ucyI6IFtdfQAABiC_ER3fu5Lfo1XdcXG340Ah18sY41_prGOr-ndF-AkKUQ"
        with client.session_transaction() as s:
            s["publisher"] = {
                "account_id": "test_account_id",
                "image": None,
                "nickname": "XYZ",
                "fullname": "ABC XYZ",
                "email": "testing@testing.com",
                "stores": [],
            }
            s["macaroons"] = "test_macaroon"
            s["developer_token"] = test_macaroon

        return f"Macaroon {test_macaroon}"
    
    def setUp(self):
        self.app = create_app(testing=True)
        self.client = self.app.test_client()
        self._candid_log_in(self.client)
        self.api_key = "qwertyuioplkjhgfdsazxcvbnmkiopuytrewqasdfghjklmnbv"



class TestGetModels(TestModelServiceEndpoints):

    @patch("webapp.admin.views.admin_api.get_store_models")
    def test_get_models(self, mock_get_store_models):
        mock_get_store_models.return_value = {"models": [{"name": "test_model"}]}
        response = self.client.get("/admin/store/1/models")
        data = response.json

        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(data["data"])

    @patch("webapp.admin.views.admin_api.get_store_models")
    def test_store_has_no_models(self, mock_get_store_models):
        mock_get_store_models.return_value = {"models": []}
        response = self.client.get("/admin/store/2/models")
        data = response.json["data"]

        success = response.json["success"]
        self.assertEqual(response.status_code, 200)
        self.assertTrue(success)
        self.assertEqual(data["models"], [])

    @patch("webapp.admin.views.admin_api.get_store_models")
    def test_invalid_store_id(self, mock_get_store_models):
        mock_get_store_models.side_effect = StoreApiResponseErrorList("Store not found", 404, [{"message": "Store not found"}])
        response = self.client.get("/admin/store/3/models")
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertIn("Store not found", data["message"])

    @patch("webapp.admin.views.admin_api.get_store_models")
    def test_unauthorized_user(self,mock_get_store_models ):
        mock_get_store_models.side_effect = StoreApiResponseErrorList("unauthorized", 401, [{"message": "unauthorized"}])
        response = self.client.get("/admin/store/1/models")
        self.assertEqual(response.status_code, 500)
        data = response.json
        self.assertFalse(data["success"])
        self.assertIn("Store not found", data["message"])

class TestCreateModel(TestModelServiceEndpoints):

    @patch("webapp.admin.views.admin_api.create_store_model")
    def test_create_model(self, mock_create_store_model):
        mock_create_store_model.return_value = None
        payload = {"name": "Test Model", "api_key": self.api_key}
        response = self.client.post("/admin/store/1/models", data=payload)
        data = response.json

        self.assertEqual(response.status_code, 201)
        self.assertTrue(data["success"])
    
    def test_create_model_with_invalid_api_key(self):
        payload = {"name": "Test Model", "api_key": "invalid_api_key"}
        response = self.client.post("/admin/store/1/models", data=payload)
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertIn("Invalid API key", data["message"])

    def test_name_too_long(self):
        payload = {"name": "some_random_long_name" * 7}
        response = self.client.post("/admin/store/1/models", data=payload)
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "Name is too long. Limit 128 characters")

    def test_missing_name(self):
        payload = {"api_key": self.api_key}
        response = self.client.post("/admin/store/1/models", data=payload)
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "An error occurred")


class TestUpdateModel(TestModelServiceEndpoints):

    @patch("webapp.admin.views.admin_api.update_store_model")
    def test_update_model(self, mock_update_store_model):
        mock_update_store_model.return_value = None
        payload = {"api_key": self.api_key}
        response = self.client.patch("/admin/store/1/models/Model1", data=payload)
        data = response.json

        self.assertEqual(response.status_code, 200)
        self.assertTrue(data["success"])

    def test_update_model_with_invalid_api_key(self):
        payload = {"api_key": "invalid_api_key"}
        response = self.client.patch("/admin/store/1/models/Model1", data=payload)
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "Invalid API key")

    @patch("webapp.admin.views.admin_api.update_store_model")
    def test_model_not_found(self, mock_update_store_model):
        mock_update_store_model.side_effect = StoreApiResourceNotFound("Model not found", 404, [{"message": "Model not found"}])
        payload = {"api_key": self.api_key}
        response = self.client.patch("/admin/store/1/models/Model1", data=payload)
        data = response.json

        self.assertEqual(response.status_code, 500)
        self.assertFalse(data["success"])
        self.assertEqual(data["message"], "Model not found")