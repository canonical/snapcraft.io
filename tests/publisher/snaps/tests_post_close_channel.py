import responses

from tests.publisher.endpoint_testing import BaseTestCases


class PostCloseChannelPageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = "/{}/release/close-channel".format(snap_name)

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            method_endpoint="POST",
        )


class PostDataCloseChannelPage(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        snap_name = "test-snap"
        snap_id = "test-id"
        endpoint_url = "/{}/release/close-channel".format(snap_name)
        api_url = (
            "https://dashboard.snapcraft.io/dev/api/"
            "snaps/{}/close".format(snap_id)
        )
        json = {"id": snap_id, "info": "json"}

        super().setUp(
            snap_name=snap_name,
            api_url=api_url,
            endpoint_url=endpoint_url,
            method_api="POST",
            method_endpoint="POST",
            json=json,
        )

    @responses.activate
    def test_page_not_found(self):
        payload = {"error_list": []}
        responses.add(responses.POST, self.api_url, json=payload, status=404)

        response = self.client.post(self.endpoint_url, json=self.json)

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

        assert response.status_code == 404
        self.assert_template_used("404.html")

    @responses.activate
    def test_post_no_data(self):
        response = self.client.post(self.endpoint_url)

        assert response.status_code == 200
        assert response.get_json() == {}

    @responses.activate
    def test_post_data(self):
        payload = {}

        responses.add(responses.POST, self.api_url, json=payload, status=200)

        response = self.client.post(self.endpoint_url, json=self.json)

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

        assert response.json == payload

    @responses.activate
    def test_return_error(self):
        payload = {"errors": [{"name": ["message"]}]}

        responses.add(responses.POST, self.api_url, json=payload, status=400)

        response = self.client.post(self.endpoint_url, json=self.json)

        assert response.json == payload
