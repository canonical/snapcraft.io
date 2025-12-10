import responses
from tests.publisher.endpoint_testing import BaseTestCases


class ListingPageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = "/api/{}/listing".format(snap_name)

        super().setUp(snap_name=snap_name, endpoint_url=endpoint_url)


class GetListingPage(BaseTestCases.EndpointLoggedInErrorHandling):
    def setUp(self):
        snap_name = "test-snap"

        api_url = "https://dashboard.snapcraft.io/dev/api/snaps/info/{}"
        api_url = api_url.format(snap_name)
        endpoint_url = "/api/{}/listing".format(snap_name)

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
            "license": "License",
            "video_urls": [],
            "categories": {"items": []},
            "status": "published",
            "update_metadata_on_release": True,
            "links": {"website": ["https://example.com"]},
        }

        responses.add(responses.GET, self.api_url, json=payload, status=200)
        responses.add(
            responses.GET,
            "https://api.snapcraft.io/v2/snaps/categories?type=shared",
            json=[],
            status=200,
        )

        endpoint = "?".join([self.endpoint_url, "from=test"])

        response = self.client.get(endpoint)

        self.check_call_by_api_url(responses.calls)

        assert response.status_code == 200

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
            "license": "license",
            "video_urls": [],
            "categories": {"items": []},
            "status": "published",
            "update_metadata_on_release": True,
            "links": {"website": ["https://example.com"]},
        }

        responses.add(responses.GET, self.api_url, json=payload, status=200)
        responses.add(
            responses.GET,
            "https://api.snapcraft.io/v2/snaps/categories?type=shared",
            json=[],
            status=200,
        )

        response = self.client.get(self.endpoint_url)

        self.check_call_by_api_url(responses.calls)

        assert response.status_code == 200

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
            "license": "license",
            "video_urls": [],
            "categories": {"items": []},
            "status": "published",
            "update_metadata_on_release": True,
            "links": {"website": ["https://example.com"]},
        }

        responses.add(responses.GET, self.api_url, json=payload, status=200)
        responses.add(
            responses.GET,
            "https://api.snapcraft.io/v2/snaps/categories?type=shared",
            json=[],
            status=200,
        )

        response = self.client.get(self.endpoint_url)

        self.check_call_by_api_url(responses.calls)

        assert response.status_code == 200

    @responses.activate
    def test_banner_images(self):
        payload = {
            "snap_id": "id",
            "snap_name": self.snap_name,
            "title": "Snap title",
            "summary": "This is a summary",
            "description": "This is a description",
            "media": [
                {"url": "/banner_1234.png", "type": "banner"},
                {"url": "/test.jpg", "type": "screenshot"},
                {"url": "/banner-icon_4321.jpg", "type": "screenshot"},
                {"url": "/banner-test.png", "type": "screenshot"},
                {"url": "/banner-icon", "type": "screenshot"},
            ],
            "publisher": {"display-name": "The publisher", "username": "toto"},
            "private": True,
            "channel_maps_list": [{"map": [{"info": "info"}]}],
            "contact": "contact adress",
            "website": "website_url",
            "public_metrics_enabled": True,
            "public_metrics_blacklist": True,
            "license": "license",
            "video_urls": [],
            "categories": {"items": []},
            "status": "published",
            "update_metadata_on_release": True,
            "links": {"website": ["https://example.com"]},
        }

        responses.add(responses.GET, self.api_url, json=payload, status=200)
        responses.add(
            responses.GET,
            "https://api.snapcraft.io/v2/snaps/categories?type=shared",
            json=[],
            status=200,
        )

        response = self.client.get(self.endpoint_url)

        self.check_call_by_api_url(responses.calls)

        assert response.status_code == 200

    @responses.activate
    def test_videos(self):
        payload = {
            "snap_id": "id",
            "snap_name": self.snap_name,
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
            "public_metrics_blacklist": True,
            "license": "license",
            "video_urls": ["https://youtube.com/watch?v=1234"],
            "categories": {"items": []},
            "status": "published",
            "update_metadata_on_release": True,
            "links": {"website": ["https://example.com"]},
        }

        responses.add(responses.GET, self.api_url, json=payload, status=200)
        responses.add(
            responses.GET,
            "https://api.snapcraft.io/v2/snaps/categories?type=shared",
            json=[],
            status=200,
        )

        response = self.client.get(self.endpoint_url)

        self.check_call_by_api_url(responses.calls)

        assert response.status_code == 200

    @responses.activate
    def test_failed_categories_api(self):
        payload = {
            "snap_id": "id",
            "snap_name": self.snap_name,
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
            "public_metrics_blacklist": True,
            "license": "license",
            "video_urls": ["https://youtube.com/watch?v=1234"],
            "categories": {"items": []},
            "status": "published",
            "update_metadata_on_release": True,
            "links": {"website": ["https://example.com"]},
        }

        responses.add(responses.GET, self.api_url, json=payload, status=200)
        responses.add(
            responses.GET,
            "https://api.snapcraft.io/v2/snaps/categories?type=shared",
            json=[],
            status=500,
        )

        response = self.client.get(self.endpoint_url)

        self.check_call_by_api_url(responses.calls)

        assert response.status_code == 200
