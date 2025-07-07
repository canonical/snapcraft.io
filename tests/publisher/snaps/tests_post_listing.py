import json

import responses
from tests.publisher.endpoint_testing import BaseTestCases


class PostListingPageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = "/api/{}/listing".format(snap_name)

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            method_endpoint="POST",
        )


class PostMetadataListingPage(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        self.snap_id = "complexId"

        snap_name = "test-snap"
        endpoint_url = "/api/{}/listing".format(snap_name)
        api_url = (
            "https://dashboard.snapcraft.io/dev/api/"
            "snaps/{}/metadata?conflict_on_update=true"
        ).format(self.snap_id)

        changes = {"description": "New description"}
        data = {"changes": json.dumps(changes), "snap_id": self.snap_id}

        super().setUp(
            snap_name=snap_name,
            api_url=api_url,
            endpoint_url=endpoint_url,
            method_api="PUT",
            method_endpoint="POST",
            data=data,
        )

    @responses.activate
    def test_post_no_data(self):
        response = self.client.post(self.endpoint_url)

        assert response.status_code == 200

    @responses.activate
    def test_update_invalid_field(self):
        response = self.client.post(
            self.endpoint_url,
            data={"changes": '{"dumb_field": "this is a dumb field"}'},
        )

        assert 0 == len(responses.calls)
        assert response.status_code == 200

    @responses.activate
    def test_update_valid_field(self):
        responses.add(responses.PUT, self.api_url, json={}, status=200)

        changes = {"description": "New description"}

        response = self.client.post(
            self.endpoint_url,
            data={"changes": json.dumps(changes), "snap_id": self.snap_id},
        )

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )
        self.assertEqual(
            b'{"description": "New description"}',
            called.request.body,
        )

        assert response.status_code == 200

    @responses.activate
    def test_update_description_with_carriage_return(self):
        responses.add(responses.PUT, self.api_url, json={}, status=200)

        changes = {"description": "This is a description\r\n"}

        response = self.client.post(
            self.endpoint_url,
            data={"changes": json.dumps(changes), "snap_id": self.snap_id},
        )

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )
        self.assertEqual(
            b'{"description": "This is a description\\n"}',
            called.request.body,
        )

        assert response.status_code == 200
