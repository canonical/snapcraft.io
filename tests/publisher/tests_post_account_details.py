import responses
from flask_testing import TestCase
from webapp import api
from webapp.app import create_app

# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class PostAccountDetailsPage(TestCase):
    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"

        return app

    @responses.activate
    def test_post_account(self):
        marketo = api.marketo.MarketoApi()
        marketo.api_session = api.requests.Session()

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

        marketo_set_subscription_url = "".join(
            [
                "https://test.com/",
                "rest/v1/leads.json?",
                "access_token=test&filterType=email",
                "&filterValues=testing@testing.com&fields=id",
            ]
        )

        marketo_set_subscription_payload = {"result": [{"id": "test"}]}

        responses.add(
            responses.POST,
            marketo_set_subscription_url,
            json=marketo_set_subscription_payload,
            status=200,
        )

        response = self.client.post(
            "/account/details",
            json={
                "action": "updateOnly",
                "asyncProcessing": False,
                "input": [
                    {"email": "test@test.com", "snapcraftnewsletter": True}
                ],
            },
        )

        self.assertEqual(2, len(responses.calls))
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
