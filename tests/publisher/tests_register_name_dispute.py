import responses
from tests.publisher.endpoint_testing import BaseTestCases


class GetRegisterNameDisputePageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = "/register-name-dispute"
        super().setUp(snap_name=None, endpoint_url=endpoint_url)


class GetRegisterNameDisputePage(BaseTestCases.BaseAppTesting):
    def setUp(self):
        super().setUp(
            snap_name="test-snap",
            api_url=None,
            endpoint_url="/register-name-dispute",
        )

    @responses.activate
    def test_register_name_dispute_logged_in(self):
        self._log_in(self.client)

        endpoint_url = "{}?snap-name={}".format(
            self.endpoint_url, self.snap_name
        )
        response = self.client.get(endpoint_url)

        self.assertEqual(response.status_code, 200)
        self.assert_template_used("publisher/register-name-dispute.html")
        self.assert_context("snap_name", "test-snap")

    @responses.activate
    def test_register_name_dispute_redirect_no_snap_name(self):
        self._log_in(self.client)
        response = self.client.get(self.endpoint_url)

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, "/register-snap")


class PostRegisterNameDisputeNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = "/register-name-dispute"
        super().setUp(
            snap_name=None, endpoint_url=endpoint_url, method_endpoint="POST"
        )


class PostRegisterNameDispute(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        api_url = (
            "https://dashboard.snapcraft.io/dev/api/register-name-dispute/"
        )
        endpoint_url = "/register-name-dispute"

        super().setUp(
            snap_name="test-snap",
            api_url=api_url,
            endpoint_url=endpoint_url,
            method_api="POST",
            method_endpoint="POST",
        )
        self.comment = "claim test-snap"

    @responses.activate
    def test_post_missing_fields(self):
        self._log_in(self.client)

        api_payload_mock = {
            "error_list": [
                {
                    "message": "an error",
                    "code": "missing-field",
                    "extra": {"field": "field"},
                }
            ]
        }

        responses.add(
            responses.POST, self.api_url, json=api_payload_mock, status=400
        )

        response = self.client.post(self.endpoint_url)

        self.assertEqual(response.status_code, 200)

        errors = self.get_context_variable("errors")
        self.assertEqual(errors, api_payload_mock["error_list"])

    @responses.activate
    def test_post_already_owned_or_disputed(self):
        self._log_in(self.client)

        api_payload_mock = {
            "error_list": [
                {
                    "message": "an error",
                    "code": "an-error-code",
                    "extra": {"something-extra": "extra something"},
                }
            ]
        }

        responses.add(
            responses.POST, self.api_url, json=api_payload_mock, status=409
        )

        response = self.client.post(self.endpoint_url)

        self.assertEqual(response.status_code, 200)

        errors = self.get_context_variable("errors")
        self.assertEqual(errors, api_payload_mock["error_list"])

    @responses.activate
    def test_post_name_dispute(self):
        self._log_in(self.client)

        responses.add(responses.POST, self.api_url, json={}, status=201)
        data = {"snap-name": self.snap_name, "comment": self.comment}
        response = self.client.post(self.endpoint_url, data=data)

        self.assertEqual(response.status_code, 200)
        self.assert_template_used(
            "publisher/register-name-dispute-success.html"
        )
        self.assert_context("snap_name", "test-snap")

    @responses.activate
    def test_post_name_dispute_error(self):
        self._log_in(self.client)

        responses.add(responses.POST, self.api_url, json={}, status=403)
        data = {"snap-name": self.snap_name, "comment": self.comment}
        response = self.client.post(self.endpoint_url, data=data)

        self.assertEqual(response.status_code, 502)
        self.assert_template_used("50X.html")
