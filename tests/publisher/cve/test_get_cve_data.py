from unittest.mock import patch
from flask_testing import TestCase
from webapp.app import create_app
import responses
from tests.publisher.endpoint_testing import BaseTestCases

# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class GetCveDataNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = "/api/snaps/cve/test-snap/1234"

        super().setUp(
            snap_name=None, endpoint_url=endpoint_url, method_endpoint="GET"
        )


class GetCveData(TestCase):
    render_templates = False

    snap_name = "test-snap"
    endpoint_url = "/api/snaps/cve/test-snap/1234"

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []
        return app

    @responses.activate
    @patch("webapp.publisher.snaps.views.authentication.is_authenticated")
    @patch(
        "webapp.publisher.cve.cve_helper.CveHelper.can_user_access_cve_data",
        return_value=True,
    )
    @patch(
        "webapp.publisher.cve.cve_helper.CveHelper.get_cve_with_revision",
        return_value=[
            {
                "id": "CVE-2023-1234",
                "cvss_severity": "high",
                "cvss_score": 7.5,
                "ubuntu_priority": "medium",
            },
            {
                "id": "CVE-2023-5678",
                "cvss_severity": "low",
                "cvss_score": 4.3,
                "ubuntu_priority": "high",
            },
        ],
    )
    @patch(
        "webapp.publisher.cve.cve_helper.CveHelper.filter_cve_data",
        return_value=[
            {
                "id": "CVE-2023-1234",
                "cvss_severity": "high",
                "cvss_score": 7.5,
                "ubuntu_priority": "medium",
            }
        ],
    )
    @patch(
        "webapp.publisher.cve.cve_helper.CveHelper.sort_cve_data",
        return_value=[
            {
                "id": "CVE-2023-1234",
                "cvss_severity": "high",
                "cvss_score": 7.5,
                "ubuntu_priority": "medium",
            }
        ],
    )
    @patch(
        "webapp.publisher.cve.cve_helper.CveHelper.paginate_cve_list",
        return_value={
            "page": 1,
            "page_size": 10,
            "total_items": 1,
            "total_pages": 1,
            "data": [
                {
                    "id": "CVE-2023-1234",
                    "cvss_severity": "high",
                    "cvss_score": 7.5,
                    "ubuntu_priority": "medium",
                }
            ],
        },
    )
    def test_get_cves_success(
        self,
        mock_paginate,
        mock_sort,
        mock_filter,
        mock_get_cves,
        mock_access,
        mock_is_authenticated,
    ):
        response = self.client.get(self.endpoint_url)
        self.assertEqual(response.status_code, 200)
        response_json = response.json

        self.assertEqual(response_json["page"], 1)
        self.assertEqual(response_json["page_size"], 10)
        self.assertEqual(response_json["total_items"], 1)
        self.assertEqual(response_json["total_pages"], 1)
        self.assertEqual(response_json["data"][0]["id"], "CVE-2023-1234")

    @responses.activate
    @patch("webapp.publisher.snaps.views.authentication.is_authenticated")
    @patch(
        "webapp.publisher.cve.cve_helper.CveHelper.can_user_access_cve_data",
        return_value=False,
    )
    def test_get_cves_forbidden(self, mock_access, mock_is_authenticated):
        response = self.client.get(self.endpoint_url)
        self.assertEqual(response.status_code, 403)
        data = response.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(
            data["error"], "User is not allowed to see snap's CVE data."
        )

    @patch("webapp.publisher.snaps.views.authentication.is_authenticated")
    @patch(
        "webapp.publisher.cve.cve_helper.CveHelper.can_user_access_cve_data",
        return_value=True,
    )
    def test_get_cves_invalid_sort(self, mock_access, mock_is_authenticated):
        response = self.client.get(
            self.endpoint_url + "?sort_by=invalid-field"
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data["success"])
        self.assertIn("Data can only be sorted by", data["error"])
