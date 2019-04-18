import responses
from tests.publisher.endpoint_testing import BaseTestCases


class PostRegisterNameJsonNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = "/register-snap/json"

        super().setUp(
            snap_name=None, endpoint_url=endpoint_url, method_endpoint="POST"
        )


class PostRegisterNameJson(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        endpoint_url = "/register-snap/json"
        api_url = "https://dashboard.snapcraft.io/dev/api/register-name/"

        data = {"snap-name": "test-snap"}

        super().setUp(
            snap_name=None,
            api_url=api_url,
            endpoint_url=endpoint_url,
            method_api="POST",
            method_endpoint="POST",
            data=data,
        )
        self.user_url = "https://dashboard.snapcraft.io/dev/api/account"

    @responses.activate
    def test_post_no_data(self):
        response = self.client.post(self.endpoint_url)

        self.assert400(response)
        self.assertEqual(len(response.json["errors"]), 1)

    @responses.activate
    def test_post_snap_name(self):
        responses.add(responses.POST, self.api_url, json={}, status=200)

        response = self.client.post(self.endpoint_url, data=self.data)

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )
        self.assertEqual(b'{"snap_name": "test-snap"}', called.request.body)

        self.assert200(response)
        self.assertEqual(response.json["code"], "created")

    @responses.activate
    def test_name_already_registered(self):
        payload = {"error_list": [{"code": "already_registered"}]}
        responses.add(responses.POST, self.api_url, json=payload, status=409)

        response = self.client.post(self.endpoint_url, data=self.data)
        errors = response.json["errors"]
        self.assertStatus(response, 409)
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0]["code"], "already_registered")

    @responses.activate
    def test_name_already_owned(self):
        payload = {"error_list": [{"code": "already_owned"}]}
        responses.add(responses.POST, self.api_url, json=payload, status=409)

        response = self.client.post(self.endpoint_url, data=self.data)

        self.assert200(response)
        self.assertEqual(response.json["code"], "already_owned")
