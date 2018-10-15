import unittest

import responses
from tests.publisher.endpoint_testing import BaseTestCases


class SettingsPageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = "/{}/settings".format(snap_name)

        super().setUp(snap_name=snap_name, endpoint_url=endpoint_url)


class GetSettingsPage(BaseTestCases.EndpointLoggedInErrorHandling):
    def setUp(self):
        snap_name = "test-snap"

        api_url = "https://dashboard.snapcraft.io/dev/api/snaps/info/{}"
        api_url = api_url.format(snap_name)
        endpoint_url = "/{}/settings".format(snap_name)

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            method_endpoint="GET",
            api_url=api_url,
            method_api="GET",
        )

    @responses.activate
    def test_page_not_found(self):
        payload = {"error_list": []}
        responses.add(responses.GET, self.api_url, json=payload, status=404)

        response = self.client.get(self.endpoint_url)

        self.check_call_by_api_url(responses.calls)

        assert response.status_code == 404
        self.assert_template_used("404.html")

    @responses.activate
    def test_account_logged_in(self):
        snap_name = "test-snap"

        payload = {
            "snap_id": "id",
            "title": "test snap",
            "snap_name": snap_name,
            "private": True,
            "price": 0,
            "store": "stotore",
            "keywords": [],
            "status": "published",
        }

        responses.add(responses.GET, self.api_url, json=payload, status=200)

        response = self.client.get(self.endpoint_url)

        self.check_call_by_api_url(responses.calls)

        assert response.status_code == 200
        self.assert_template_used("publisher/settings.html")

        self.assert_context("snap_id", "id")
        self.assert_context("snap_title", "test snap")
        self.assert_context("snap_name", snap_name)
        self.assert_context("private", True)
        self.assert_context("price", 0)
        self.assert_context("store", "stotore")
        self.assert_context("keywords", [])
        self.assert_context("status", "published")


if __name__ == "__main__":
    unittest.main()
