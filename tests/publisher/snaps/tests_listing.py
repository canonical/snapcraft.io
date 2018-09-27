import unittest
import responses

from tests.publisher.endpoint_testing import BaseTestCases


class ListingPageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = "/{}/listing".format(snap_name)

        super().setUp(snap_name=snap_name, endpoint_url=endpoint_url)


class GetListingPage(BaseTestCases.EndpointLoggedInErrorHandling):
    def setUp(self):
        snap_name = "test-snap"

        api_url = "https://dashboard.snapcraft.io/dev/api/snaps/info/{}"
        api_url = api_url.format(snap_name)
        endpoint_url = "/{}/listing".format(snap_name)

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
            "snap_name": snap_name,
            "title": "Snap title",
            "summary": "This is a summary",
            "description": "This is a description",
            "media": [],
            "publisher": {"display-name": "The publisher", "username": "toto"},
            "private": True,
            "channel_maps_list": [{"map": [{"info": "info"}]}],
            "contact": "contact adress",
            "website": "website_url",
            "public_metrics_enabled": True,
            "public_metrics_blacklist": False,
            "video_urls": [],
        }

        responses.add(responses.GET, self.api_url, json=payload, status=200)

        response = self.client.get(self.endpoint_url)

        self.check_call_by_api_url(responses.calls)

        assert response.status_code == 200
        self.assert_template_used("publisher/listing.html")

        self.assert_context("snap_id", "id")
        self.assert_context("snap_name", snap_name)
        self.assert_context("snap_title", "Snap title")
        self.assert_context("summary", "This is a summary")
        self.assert_context("description", "This is a description")
        self.assert_context("icon_url", None)
        self.assert_context("publisher_name", "The publisher")
        self.assert_context("username", "toto")
        self.assert_context("screenshot_urls", [])
        self.assert_context("contact", "contact adress")
        self.assert_context("website", "website_url")
        self.assert_context("is_on_stable", False)
        self.assert_context("public_metrics_enabled", True)
        self.assert_context("public_metrics_blacklist", False)
        self.assert_context("video_urls", [])

    @responses.activate
    def test_icon(self):
        payload = {
            "snap_id": "id",
            "snap_name": self.snap_name,
            "title": "Snap title",
            "summary": "This is a summary",
            "description": "This is a description",
            "media": [{"url": "this is a url", "type": "icon"}],
            "publisher": {"display-name": "The publisher", "username": "toto"},
            "private": True,
            "channel_maps_list": [{"map": [{"info": "info"}]}],
            "contact": "contact adress",
            "website": "website_url",
            "public_metrics_enabled": True,
            "public_metrics_blacklist": True,
            "video_urls": [],
        }

        responses.add(responses.GET, self.api_url, json=payload, status=200)

        response = self.client.get(self.endpoint_url)

        self.check_call_by_api_url(responses.calls)

        assert response.status_code == 200
        self.assert_template_used("publisher/listing.html")

        self.assert_context("icon_url", "this is a url")

    @responses.activate
    def test_screenshots(self):
        payload = {
            "snap_id": "id",
            "snap_name": self.snap_name,
            "title": "Snap title",
            "summary": "This is a summary",
            "description": "This is a description",
            "media": [{"url": "this is a url", "type": "screenshot"}],
            "publisher": {"display-name": "The publisher", "username": "toto"},
            "private": True,
            "channel_maps_list": [{"map": [{"info": "info"}]}],
            "contact": "contact adress",
            "website": "website_url",
            "public_metrics_enabled": True,
            "public_metrics_blacklist": True,
            "video_urls": [],
        }

        responses.add(responses.GET, self.api_url, json=payload, status=200)

        response = self.client.get(self.endpoint_url)

        self.check_call_by_api_url(responses.calls)

        assert response.status_code == 200
        self.assert_template_used("publisher/listing.html")

        self.assert_context("screenshot_urls", ["this is a url"])


if __name__ == "__main__":
    unittest.main()
