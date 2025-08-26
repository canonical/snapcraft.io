from unittest.mock import patch


class GetValidationSetsTest:
    @patch("webapp.store.get_validation_sets")
    def test_get_validation_sets(self, mock_get_validation_sets):
        mock_get_validation_sets.return_value = {"assertions": []}
        response = self.client.get("/api/validation-sets")
        data = response.json
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(data["data"])

    @patch("webapp.store.get_validation_set")
    def test_get_validation_set(self, mock_get_validation_set):
        mock_get_validation_set.return_value = {"assertions": []}
        response = self.client.get("/api/validation-sets/validation-set-id")
        data = response.json
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(data["data"])
