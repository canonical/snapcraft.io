from unittest.mock import MagicMock, patch

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
    @patch("webapp.publisher.views.marketo")
    def test_account(self, marketo):
        responses.add(responses.GET, self.api_url, json={}, status=200)

        marketo.get_user = MagicMock(return_value={"id": "test"})
        marketo.get_newsletter_subscription = MagicMock(
            return_value={"snapcraftnewsletter": True}
        )

        response = self.client.get(self.endpoint_url)

        marketo.get_user.assert_called_with("testing@testing.com")
        marketo.get_newsletter_subscription.assert_called_with("test")

        self.assertEqual(200, response.status_code)
        self.assert_template_used("publisher/account-details.html")
        self.assert_context("username", "Toto")
        self.assert_context("displayname", "El Toto")
        self.assert_context("email", "testing@testing.com")
        self.assert_context("image", None)
        self.assert_context("subscriptions", {"newsletter": True})

    @responses.activate
    @patch("webapp.publisher.views.marketo")
    def test_account_marketo_no_sub(self, marketo):
        responses.add(responses.GET, self.api_url, json={}, status=200)

        marketo.get_user = MagicMock(return_value={"id": "test"})
        marketo.get_newsletter_subscription = MagicMock(return_value={})

        response = self.client.get(self.endpoint_url)

        marketo.get_user.assert_called_with("testing@testing.com")
        marketo.get_newsletter_subscription.assert_called_with("test")

        self.assertEqual(200, response.status_code)
        self.assert_template_used("publisher/account-details.html")
        self.assert_context("username", "Toto")
        self.assert_context("displayname", "El Toto")
        self.assert_context("email", "testing@testing.com")
        self.assert_context("image", None)
        self.assert_context("subscriptions", {"newsletter": False})

    @responses.activate
    @patch("webapp.publisher.views.marketo")
    def test_account_marketo_exception(self, marketo):
        responses.add(responses.GET, self.api_url, json={}, status=200)

        marketo.get_user = MagicMock(side_effect=Exception())

        response = self.client.get(self.endpoint_url)

        marketo.get_user.assert_called_with("testing@testing.com")

        self.assertEqual(200, response.status_code)
        self.assert_template_used("publisher/account-details.html")
        self.assert_context("username", "Toto")
        self.assert_context("displayname", "El Toto")
        self.assert_context("email", "testing@testing.com")
        self.assert_context("image", None)
        self.assert_context("subscriptions", None)
