import responses
from tests.publisher.endpoint_testing import BaseTestCases
from cache.cache_utility import redis_cache


class ListingPageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        # Clear cache before each test
        if redis_cache.redis_available:
            try:
                redis_cache.client.flushdb()
            except Exception:
                pass
        else:
            redis_cache.fallback.clear()

        snap_name = "test-snap"
        endpoint_url = "/api/{}/listing".format(snap_name)

        super().setUp(snap_name=snap_name, endpoint_url=endpoint_url)


class GetListingPage(BaseTestCases.EndpointLoggedInErrorHandling):
    def setUp(self):
        # Clear cache before each test
        if redis_cache.redis_available:
            try:
                redis_cache.client.flushdb()
            except Exception:
                pass
        else:
            redis_cache.fallback.clear()

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

    @responses.activate
    def test_cache_hit_on_second_request(self):
        """Test that second GET request uses cache instead of API"""
        payload = {
            "snap_id": "id",
            "snap_name": self.snap_name,
            "title": "Snap title",
            "summary": "This is a summary",
            "description": "This is a description",
            "media": [],
            "publisher": {
                "display-name": "The publisher",
                "username": "toto",
            },
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

        # First request should hit API
        response1 = self.client.get(self.endpoint_url)
        assert response1.status_code == 200

        snap_info_calls_before = [
            call
            for call in responses.calls
            if self.api_url in call.request.url
        ]
        assert len(snap_info_calls_before) == 1

        # Second request should use cache (no additional snap info API calls)
        response2 = self.client.get(self.endpoint_url)
        assert response2.status_code == 200
        snap_info_calls_after = [
            call
            for call in responses.calls
            if self.api_url in call.request.url
        ]
        # Should have same number of calls (cache hit)
        assert len(snap_info_calls_after) == len(snap_info_calls_before)

    @responses.activate
    def test_cache_stores_data_correctly(self):
        """Test that cached data matches API response"""
        payload = {
            "snap_id": "cached-id",
            "snap_name": self.snap_name,
            "title": "Cached Snap Title",
            "summary": "This is a cached summary",
            "description": "This is a cached description",
            "media": [],
            "publisher": {
                "display-name": "Cached Publisher",
                "username": "cached",
            },
            "private": False,
            "channel_maps_list": [{"map": [{"info": "info"}]}],
            "contact": "cached@example.com",
            "website": "https://cached.example.com",
            "public_metrics_enabled": True,
            "public_metrics_blacklist": False,
            "license": "MIT",
            "video_urls": [],
            "categories": {"items": []},
            "status": "published",
            "update_metadata_on_release": False,
            "links": {"website": ["https://cached.example.com"]},
        }

        responses.add(responses.GET, self.api_url, json=payload, status=200)
        responses.add(
            responses.GET,
            "https://api.snapcraft.io/v2/snaps/categories?type=shared",
            json=[],
            status=200,
        )

        # First request
        response1 = self.client.get(self.endpoint_url)
        assert response1.status_code == 200
        data1 = response1.get_json()

        # Second request (from cache)
        response2 = self.client.get(self.endpoint_url)
        assert response2.status_code == 200
        data2 = response2.get_json()

        # Verify data matches
        assert data1["data"]["snap_id"] == data2["data"]["snap_id"]
        assert data1["data"]["title"] == data2["data"]["title"]
        assert data1["data"]["summary"] == data2["data"]["summary"]
        assert data1["data"]["description"] == data2["data"]["description"]
