import json

import responses
from tests.publisher.endpoint_testing import BaseTestCases
from cache.cache_utility import redis_cache


class PostListingPageNotAuth(BaseTestCases.EndpointLoggedOut):
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

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            method_endpoint="POST",
        )


class PostMetadataListingPage(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        # Clear cache before each test
        if redis_cache.redis_available:
            try:
                redis_cache.client.flushdb()
            except Exception:
                pass
        else:
            redis_cache.fallback.clear()

        self.snap_id = "complexId"

        snap_name = "test-snap"
        endpoint_url = "/api/{}/listing".format(snap_name)
        api_url = (
            "https://dashboard.snapcraft.io/dev/api/"
            "snaps/{}/metadata?conflict_on_update=true"
        ).format(self.snap_id)

        changes = {"description": "New description"}
        data = {"changes": json.dumps(changes), "snap_id": self.snap_id}

        super().setUp(
            snap_name=snap_name,
            api_url=api_url,
            endpoint_url=endpoint_url,
            method_api="PUT",
            method_endpoint="POST",
            data=data,
        )

    @responses.activate
    def test_post_no_data(self):
        response = self.client.post(self.endpoint_url)

        assert response.status_code == 200

    @responses.activate
    def test_update_invalid_field(self):
        response = self.client.post(
            self.endpoint_url,
            data={"changes": '{"dumb_field": "this is a dumb field"}'},
        )

        assert 0 == len(responses.calls)
        assert response.status_code == 200

    @responses.activate
    def test_update_valid_field(self):
        responses.add(responses.PUT, self.api_url, json={}, status=200)

        changes = {"description": "New description"}

        response = self.client.post(
            self.endpoint_url,
            data={"changes": json.dumps(changes), "snap_id": self.snap_id},
        )

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )
        self.assertEqual(
            b'{"description": "New description"}',
            called.request.body,
        )

        assert response.status_code == 200

    @responses.activate
    def test_update_description_with_carriage_return(self):
        responses.add(responses.PUT, self.api_url, json={}, status=200)

        changes = {"description": "This is a description\r\n"}

        response = self.client.post(
            self.endpoint_url,
            data={"changes": json.dumps(changes), "snap_id": self.snap_id},
        )

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )
        self.assertEqual(
            b'{"description": "This is a description\\n"}',
            called.request.body,
        )

        assert response.status_code == 200

    @responses.activate
    def test_cache_invalidation_after_metadata_update(self):
        """Test cache invalidation after successful metadata update"""
        snap_name = "test-snap"

        get_url = f"/api/{snap_name}/listing"
        get_api_url = (
            f"https://dashboard.snapcraft.io/dev/api/snaps/info/"
            f"{snap_name}"
        )

        get_payload = {
            "snap_id": self.snap_id,
            "snap_name": snap_name,
            "title": "Original Title",
            "summary": "Original summary",
            "description": "Original description",
            "media": [],
            "publisher": {
                "display-name": "Publisher",
                "username": "user",
            },
            "private": True,
            "channel_maps_list": [{"map": [{"info": "info"}]}],
            "contact": "contact@example.com",
            "website": "https://example.com",
            "public_metrics_enabled": True,
            "public_metrics_blacklist": False,
            "license": "MIT",
            "video_urls": [],
            "categories": {"items": []},
            "status": "published",
            "update_metadata_on_release": True,
            "links": {"website": ["https://example.com"]},
        }

        responses.add(responses.GET, get_api_url, json=get_payload, status=200)
        responses.add(
            responses.GET,
            "https://api.snapcraft.io/v2/snaps/categories?type=shared",
            json=[],
            status=200,
        )

        get_response = self.client.get(get_url)
        assert get_response.status_code == 200

        snap_info_calls_before = [
            call for call in responses.calls if get_api_url in call.request.url
        ]
        initial_snap_info_calls = len(snap_info_calls_before)

        # Second GET should use cache (no additional snap info API calls)
        get_response_cached = self.client.get(get_url)
        assert get_response_cached.status_code == 200
        snap_info_calls_cached = [
            call for call in responses.calls if get_api_url in call.request.url
        ]
        assert len(snap_info_calls_cached) == initial_snap_info_calls

        # Update metadata via POST (should invalidate cache)
        responses.add(responses.PUT, self.api_url, json={}, status=200)

        changes = {"description": "Updated description"}
        post_response = self.client.post(
            self.endpoint_url,
            data={
                "changes": json.dumps(changes),
                "snap_id": self.snap_id,
            },
        )
        assert post_response.status_code == 200

        # Another GET request, should hit API
        updated_payload = get_payload.copy()
        updated_payload["description"] = "Updated description"
        responses.add(
            responses.GET, get_api_url, json=updated_payload, status=200
        )
        responses.add(
            responses.GET,
            "https://api.snapcraft.io/v2/snaps/categories?type=shared",
            json=[],
            status=200,
        )

        get_response2 = self.client.get(get_url)
        assert get_response2.status_code == 200

        # Verify snap info API was called again after POST
        snap_info_calls_after = [
            call for call in responses.calls if get_api_url in call.request.url
        ]
        assert len(snap_info_calls_after) == len(snap_info_calls_before) + 1

    @responses.activate
    def test_cache_invalidation_after_screenshot_update(self):
        """Test cache invalidation after updating with images field"""
        snap_name = "test-snap"

        get_url = f"/api/{snap_name}/listing"
        get_api_url = (
            f"https://dashboard.snapcraft.io/dev/api/snaps/info/"
            f"{snap_name}"
        )

        get_payload = {
            "snap_id": self.snap_id,
            "snap_name": snap_name,
            "title": "Test Snap",
            "summary": "Summary",
            "description": "Description",
            "media": [],
            "publisher": {
                "display-name": "Publisher",
                "username": "user",
            },
            "private": True,
            "channel_maps_list": [{"map": [{"info": "info"}]}],
            "contact": "contact@example.com",
            "website": "https://example.com",
            "public_metrics_enabled": True,
            "public_metrics_blacklist": False,
            "license": "MIT",
            "video_urls": [],
            "categories": {"items": []},
            "status": "published",
            "update_metadata_on_release": True,
            "links": {"website": ["https://example.com"]},
        }

        responses.add(responses.GET, get_api_url, json=get_payload, status=200)
        responses.add(
            responses.GET,
            "https://api.snapcraft.io/v2/snaps/categories?type=shared",
            json=[],
            status=200,
        )

        get_response = self.client.get(get_url)
        assert get_response.status_code == 200

        snap_info_calls_before = [
            call for call in responses.calls if get_api_url in call.request.url
        ]
        initial_snap_info_calls = len(snap_info_calls_before)

        # Second GET should hit cache
        get_response_cached = self.client.get(get_url)
        assert get_response_cached.status_code == 200
        snap_info_calls_cached = [
            call for call in responses.calls if get_api_url in call.request.url
        ]
        assert len(snap_info_calls_cached) == initial_snap_info_calls

        # update should trigger cache invalidation
        screenshot_api_url = (
            f"https://dashboard.snapcraft.io/dev/api/snaps/"
            f"{self.snap_id}/binary-metadata"
        )

        responses.add(
            responses.GET,
            screenshot_api_url,
            json={"screenshot_urls": []},
            status=200,
        )

        responses.add(
            responses.PUT,
            screenshot_api_url,
            json={},
            status=200,
        )

        changes = {"images": []}
        post_response = self.client.post(
            self.endpoint_url,
            data={
                "changes": json.dumps(changes),
                "snap_id": self.snap_id,
            },
        )
        assert post_response.status_code == 200

        responses.add(responses.GET, get_api_url, json=get_payload, status=200)
        responses.add(
            responses.GET,
            "https://api.snapcraft.io/v2/snaps/categories?type=shared",
            json=[],
            status=200,
        )

        get_response3 = self.client.get(get_url)
        assert get_response3.status_code == 200

        # Verify snap info API was called again after POST
        snap_info_calls_after = [
            call for call in responses.calls if get_api_url in call.request.url
        ]
        # Should have one more call than before (cache was invalidated)
        assert len(snap_info_calls_after) == initial_snap_info_calls + 1
