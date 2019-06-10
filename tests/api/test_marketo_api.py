import unittest
import responses

import webapp.api.marketo as marketo_api

responses.mock.assert_all_requests_are_fired = True


class MarketoApi(unittest.TestCase):
    @responses.activate
    def test_auth(self):
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

        marketo = marketo_api.MarketoApi()
        user = marketo.get_user("testing@testing.com")

        self.assertEqual(user, {"id": "test"})

    @responses.activate
    def test_get_user(self):
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

        marketo = marketo_api.MarketoApi()
        marketo.token = "test"
        user = marketo.get_user("testing@testing.com")

        self.assertEqual(user, {"id": "test"})

    @responses.activate
    def test_get_newsletter_subscription(self):
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

        marketo = marketo_api.MarketoApi()
        marketo.token = "test"
        subscription = marketo.get_newsletter_subscription("test")

        self.assertEqual(subscription, {"snapcraftnewsletter": True})

    @responses.activate
    def test_get_newsletter_subscription_bad_response(self):
        marketo_lead_url = "".join(
            [
                "https://test.com/",
                "rest/v1/lead/test.json?",
                "access_token=test&fields=id,email,snapcraftnewsletter",
            ]
        )

        marketo_lead_payload = {"badkey": "bad"}

        responses.add(
            responses.GET,
            marketo_lead_url,
            json=marketo_lead_payload,
            status=200,
        )

        marketo = marketo_api.MarketoApi()
        marketo.token = "test"
        subscription = marketo.get_newsletter_subscription("test")

        self.assertEqual(subscription, {})

    @responses.activate
    def test_set_newsletter_subscription(self):
        marketo_set_subscription_url = "".join(
            [
                "https://test.com/",
                "rest/v1/leads.json?",
                "access_token=test&filterType=email",
                "&filterValues=testing@testing.com&fields=id",
            ]
        )

        responses.add(
            responses.POST, marketo_set_subscription_url, json={}, status=200
        )

        marketo = marketo_api.MarketoApi()
        marketo.token = "test"
        response = marketo.set_newsletter_subscription("test", True)

        self.assertEqual(response, {})

    @responses.activate
    def test_token_refresh(self):
        marketo_leads_url = "".join(
            [
                "https://test.com/",
                "rest/v1/leads.json?",
                "access_token=test&filterType=email",
                "&filterValues=testing@testing.com&fields=id",
            ]
        )

        marketo_leads_payload = {"result": [{"id": "test"}]}

        responses.add(responses.GET, marketo_leads_url, status=602)

        marketo_auth_url = "".join(
            [
                "https://test.com/",
                "identity/oauth/token?",
                "grant_type=client_credentials&client_id=123",
                "&client_secret=321",
            ]
        )

        marketo_auth_payload = {"access_token": "refreshed_token"}

        responses.add(
            responses.GET,
            marketo_auth_url,
            json=marketo_auth_payload,
            status=200,
        )

        responses.add(
            responses.GET,
            marketo_leads_url,
            json=marketo_leads_payload,
            status=200,
        )

        marketo = marketo_api.MarketoApi()
        marketo.token = "expired_token"
        marketo.get_user("testing@testing.com")

        self.assertEqual(marketo.token, "refreshed_token")
