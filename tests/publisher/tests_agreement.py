import responses
from tests.publisher.endpoint_testing import BaseTestCases


class GetAgreementPage(BaseTestCases.BaseAppTesting):
    def setUp(self):
        endpoint_url = "/account/agreement"
        super().setUp(snap_name=None, api_url=None, endpoint_url=endpoint_url)

    @responses.activate
    def test_agreement_logged_in(self):
        self._log_in(self.client)
        response = self.client.get("/account/agreement")

        assert response.status_code == 200
        self.assert_template_used("store/publisher.html")


class PostAgreementPage(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        api_url = "https://dashboard.snapcraft.io/dev/api/agreement/"
        data = {"agreed": True}
        endpoint_url = "/account/agreement"

        super().setUp(
            snap_name=None,
            endpoint_url=endpoint_url,
            api_url=api_url,
            method_endpoint="POST",
            method_api="POST",
            json=data,
        )

    @responses.activate
    def test_post_agreement_on(self):
        responses.add(
            responses.POST, self.api_url, json={"success": True}, status=200
        )

        response = self.client.post(self.endpoint_url, json={"agreed": True})

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )
        self.assertEqual(b'{"latest_tos_accepted": true}', called.request.body)

        self.assertEqual(response.json, {"success": True})
