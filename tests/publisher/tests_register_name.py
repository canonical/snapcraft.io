import responses
from tests.publisher.endpoint_testing import BaseTestCases


class GetRegisterNamePage(BaseTestCases.BaseAppTesting):
    def setUp(self):
        endpoint_url = "/register-snap"
        super().setUp(snap_name=None, api_url=None, endpoint_url=endpoint_url)
        self.user_url = "https://dashboard.snapcraft.io/dev/api/account"

    @responses.activate
    def test_register_name_logged_in(self):
        self._log_in(self.client)

        responses.add(responses.GET, self.user_url, status=200)

        response = self.client.get(self.endpoint_url)

        assert response.status_code == 200
        self.assert_template_used("store/publisher.html")


class PostRegisterNamePageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = "/api/register-snap"

        super().setUp(
            snap_name=None, endpoint_url=endpoint_url, method_endpoint="POST"
        )


class PostRegisterNamePage(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        endpoint_url = "/api/register-snap"
        api_url = "https://dashboard.snapcraft.io/dev/api/register-name/"

        data = {"snap_name": "test-snap"}

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

        assert response.status_code == 200

    @responses.activate
    def test_post_store(self):
        responses.add(responses.POST, self.api_url, json={}, status=200)

        self.data["store"] = "store"
        response = self.client.post(self.endpoint_url, data=self.data)

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )
        self.assertEqual(self.api_url, called.request.url)
        self.assertIn(b'"snap_name": "test-snap"', called.request.body)
        self.assertIn(b'"store": "store"', called.request.body)

        assert response.status_code == 200

    @responses.activate
    def test_post_private(self):
        responses.add(responses.POST, self.api_url, json={}, status=200)

        self.data["is_private"] = "private"
        response = self.client.post(self.endpoint_url, data=self.data)

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )
        self.assertIn(b'"snap_name": "test-snap"', called.request.body)
        self.assertIn(b'"is_private": true', called.request.body)

        assert response.status_code == 200

    @responses.activate
    def test_name_already_registered(self):
        payload = {"error_list": [{"code": "already_registered"}]}
        responses.add(responses.POST, self.api_url, json=payload, status=409)

        user_payload = {"error_list": [], "stores": []}
        responses.add(
            responses.GET, self.user_url, json=user_payload, status=200
        )

        response = self.client.post(self.endpoint_url, data=self.data)

        assert response.status_code == 200

    @responses.activate
    def test_name_reserved(self):
        payload = {"error_list": [{"code": "reserved_name"}]}
        responses.add(responses.POST, self.api_url, json=payload, status=409)

        user_payload = {"error_list": [], "stores": []}
        responses.add(
            responses.GET, self.user_url, json=user_payload, status=200
        )

        response = self.client.post(self.endpoint_url, data=self.data)

        assert response.status_code == 200

    @responses.activate
    def test_claim_dispute(self):
        payload = {
            "success": False,
            "data": {
                "snap_name": "test-snap",
                "is_private": "private",
                "store": "store",
                "error_code": "already_claimed",
            },
        }
        responses.add(responses.POST, self.api_url, json=payload, status=200)

        response = self.client.post(self.endpoint_url, data=self.data)

        assert response.status_code == 200
