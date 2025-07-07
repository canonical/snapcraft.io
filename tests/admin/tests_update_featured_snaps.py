from unittest.mock import Mock, patch
from tests.admin.admin_endpoint_testing import TestAdminEndpoints


class TestUpdateFeaturedSnaps(TestAdminEndpoints):
    def setUp(self):
        self.mock_flask = patch("webapp.admin.views.flask").start()
        self.mock_get_snap_id = patch(
            "webapp.admin.views.dashboard.get_snap_id"
        ).start()
        self.mock_get_featured_snaps = patch(
            "webapp.admin.views.device_gateway.get_featured_snaps"
        ).start()
        self.mock_delete_featured_snaps = patch(
            "webapp.admin.views.publisher_gateway.delete_featured_snaps"
        ).start()
        self.mock_update_featured_snaps = patch(
            "webapp.admin.views.publisher_gateway.update_featured_snaps"
        ).start()
        super().setUp()

    def tearDown(self):
        # Clean up the patches after each test
        patch.stopall()

    def test_update_featured_snaps(self):
        self.mock_flask.request.form.get.return_value = "snap_id1,snap_id2"
        self.mock_get_featured_snaps.side_effect = [
            {
                "_embedded": {
                    "clickindex:package": [{"snap_id": 1}, {"snap_id": 2}]
                },
                "_links": {"next": False},
            },
            {},
        ]
        delete_response = Mock()
        delete_response.status_code = 201
        self.mock_delete_featured_snaps.return_value = delete_response

        mock_update_response = Mock()
        mock_update_response.status_code = 201
        self.mock_update_featured_snaps.return_value = mock_update_response

        self.mock_get_snap_id.side_effect = [1, 2]

        response = self.client.post("/admin/featured")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, {"success": True})

    def test_update_featured_snaps_no_snaps(self):
        with self.app.test_request_context("/admin/featured"):
            self.mock_flask.request.form.get.return_value = ""
            self.mock_get_featured_snaps.side_effect = [
                {
                    "_embedded": {
                        "clickindex:package": [{"snap_id": 1}, {"snap_id": 2}]
                    },
                    "_links": {"next": False},
                },
                {},
            ]
            mock_delete_response = Mock()
            mock_delete_response.status_code = 201
            self.mock_delete_featured_snaps.return_value = mock_delete_response

            mock_update_response = Mock()
            mock_update_response.status_code = 201
            self.mock_update_featured_snaps.return_value = mock_update_response

            self.mock_get_snap_id.side_effect = []

            response = self.client.post("/admin/featured")
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json.get("success"), False)
        self.assertEqual(response.json.get("message"), "Snaps cannot be empty")

    def test_update_featured_snaps_delete_failed(self):
        with self.app.test_request_context("/admin/featured"):
            self.mock_flask.request.form.get.return_value = "snap_id1,snap_id2"
            self.mock_get_featured_snaps.side_effect = [
                {
                    "_embedded": {
                        "clickindex:package": [{"snap_id": 1}, {"snap_id": 2}]
                    },
                    "_links": {"next": False},
                },
                {},
            ]
            mock_delete_response = Mock()
            mock_delete_response.status_code = 400
            self.mock_delete_featured_snaps.return_value = mock_delete_response

            mock_update_response = Mock()
            mock_update_response.status_code = 201
            self.mock_update_featured_snaps.return_value = mock_update_response

            self.mock_get_snap_id.side_effect = [1, 2]

            response = self.client.post("/admin/featured")
        self.assertEqual(response.status_code, 500)

    def test_update_featured_snaps_update_failed(self):
        with self.app.test_request_context("/admin/featured"):
            self.mock_flask.request.form.get.return_value = "snap_id1,snap_id2"
            self.mock_get_featured_snaps.side_effect = [
                {
                    "_embedded": {
                        "clickindex:package": [{"snap_id": 1}, {"snap_id": 2}]
                    },
                    "_links": {"next": False},
                },
                {},
            ]
            mock_delete_response = Mock()
            mock_delete_response.status_code = 201
            self.mock_delete_featured_snaps.return_value = mock_delete_response

            mock_update_response = Mock()
            mock_update_response.status_code = 400
            self.mock_update_featured_snaps.return_value = mock_update_response

            self.mock_get_snap_id.side_effect = [1, 2]

            response = self.client.post("/admin/featured")
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json.get("success"), False)
