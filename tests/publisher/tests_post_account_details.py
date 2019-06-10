from unittest.mock import MagicMock, patch

import responses
from tests.publisher.endpoint_testing import BaseTestCases

# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class PostAccountDetailsPageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = "/account/details"

        super().setUp(
            snap_name=None, endpoint_url=endpoint_url, method_endpoint="POST"
        )


class PostAccountDetailsPage(BaseTestCases.BaseAppTesting):
    def setUp(self):
        api_url = "https://test.com/"
        endpoint_url = "/account/details"

        super().setUp(
            snap_name=None, api_url=api_url, endpoint_url=endpoint_url
        )

    @responses.activate
    @patch("webapp.publisher.views.marketo")
    def test_post_account(self, marketo):
        self._log_in(self.client)

        marketo.set_newsletter_subscription = MagicMock()

        response = self.client.post(
            self.endpoint_url,
            data={"email": "test@test.com", "newsletter": True},
        )

        marketo.set_newsletter_subscription.assert_called_with(
            "test@test.com", "True"
        )

        with self.client.session_transaction() as session:
            category, flash = session["_flashes"][0]
            self.assertEqual("positive", category)
            self.assertEqual("Changes applied successfully.", flash)

        self.assertEqual(302, response.status_code)

    @patch("webapp.publisher.views.marketo")
    def test_post_account_exception(self, marketo):
        self._log_in(self.client)

        marketo.set_newsletter_subscription = MagicMock(
            side_effect=Exception()
        )
        response = self.client.post(self.endpoint_url)

        with self.client.session_transaction() as session:
            category, flash = session["_flashes"][0]
            self.assertEqual("negative", category)
            self.assertEqual("There was an error, please try again.", flash)

        self.assertEqual(302, response.status_code)
