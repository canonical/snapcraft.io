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
