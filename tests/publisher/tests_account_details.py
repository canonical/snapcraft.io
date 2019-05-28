import responses
from tests.publisher.endpoint_testing import BaseTestCases

# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class AccountDetailsNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = "/account/details"

        super().setUp(snap_name=None, endpoint_url=endpoint_url)


class AccountDetailsPage(BaseTestCases.EndpointLoggedInErrorHandling):
    def setUp(self):
        api_url = "https://dashboard.snapcraft.io/dev/api/account"
        endpoint_url = "/account/details"

        super().setUp(
            snap_name=None,
            endpoint_url=endpoint_url,
            method_endpoint="GET",
            api_url=api_url,
            method_api="GET",
        )

    @responses.activate
    def test_account(self):
        responses.add(responses.GET, self.api_url, json={}, status=200)

        marketo_auth_url = "".join(
            [
                "https://test.com/",
                "identity/oauth/token?",
                "grant_type=client_credentials&client_id=123",
                "&client_secret=321",
            ]
        )

        marketo_auth_payload = {"access_token": "test"}

        responses.add(
            responses.GET,
            marketo_auth_url,
            json=marketo_auth_payload,
            status=200,
        )

        marketo_leads_url = "".join(
            [
                "https://test.com/",
                "rest/v1/leads.json?",
                "access_token=test&filterType=email",
                "&filterValues=testing@testing.com&fields=id",
            ]
        )

        marketo_leads_payload = {"result": [{"id": "test"}]}

        responses.add(
            responses.GET,
            marketo_leads_url,
            json=marketo_leads_payload,
            status=200,
        )

        marketo_lead_url = "".join(
            [
                "https://test.com/",
                "rest/v1/lead/test.json?",
                "access_token=test&fields=id,email,snapcraftnewsletter",
            ]
        )

        marketo_lead_payload = {"result": [{"snapcraftnewsletter": True}]}

        responses.add(
            responses.GET,
            marketo_lead_url,
            json=marketo_lead_payload,
            status=200,
        )

        response = self.client.get(self.endpoint_url)

        self.assertEqual(4, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

        self.assertEqual(200, response.status_code)
        self.assert_template_used("publisher/account-details.html")
        self.assert_context("username", "Toto")
        self.assert_context("displayname", "El Toto")
        self.assert_context("email", "testing@testing.com")
        self.assert_context("image", None)
