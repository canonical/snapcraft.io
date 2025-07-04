import responses
from unittest.mock import patch
from tests.publisher.endpoint_testing import BaseTestCases
from canonicalwebteam.exceptions import (
    StoreApiResourceNotFound,
    StoreApiResponseErrorList,
)

# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class TestGetPackageMetadata(BaseTestCases):
    def setUp(self):
        super().setUp()

    @responses.activate
    @patch(
        "canonicalwebteam.store_api.publishergw."
        "PublisherGW.get_package_metadata"
    )
    def test_get_package_metadata(self, mock_get_package_metadata):
        # testing for track guardrails
        mock_metadata = {
            "track-guardrails": {
                "created-at": "2024-03-26T11:54:50.062999",
                "pattern": "^v\\.[0-9]+",
            }
        }
        mock_get_package_metadata.return_value = mock_metadata

        self.client.set_session_data(
            {"publisher": {"nickname": "test_username"}}
        )

        snap_name = "test_snap"
        api_response = {"metadata": mock_metadata}
        responses.add(
            responses.GET,
            f"https://api.charmhub.io/v1/snap/{snap_name}",
            json=api_response,
            status=200,
        )

        response = self.client.get(f"/api/packages/{snap_name}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json,
            {"data": mock_metadata, "success": True},
        )
        mock_get_package_metadata.assert_called_once_with(
            self.client.session,
            "snap",
            snap_name,
        )

    @responses.activate
    @patch(
        "canonicalwebteam.store_api.publishergw."
        "PublisherGW.get_package_metadata"
    )
    def test_package_not_found(self, mock_get_package_metadata):
        mock_get_package_metadata.side_effect = StoreApiResourceNotFound()

        self.client.set_session_data(
            {"publisher": {"nickname": "test_username"}}
        )

        response = self.client.get("/api/packages/test_snap")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json,
            {"error": "Package not found", "success": False},
        )

    @responses.activate
    @patch(
        "canonicalwebteam.store_api.publishergw."
        "PublisherGW.get_package_metadata"
    )
    def test_api_error_with_list(self, mock_get_package_metadata):
        mock_get_package_metadata.side_effect = StoreApiResponseErrorList(
            "The api returned a list of errors",
            403,
            [
                {
                    "code": "permission-required",
                    "message": (
                        "No publisher or collaborator "
                        "permission for the teams-for-linux snap package"
                    ),
                }
            ],
        )
