import io
import json
import unittest

import responses
from tests.publisher.endpoint_testing import BaseTestCases


class PostBinaryMetadataListingPageLoggedOut(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = "/{}/listing".format(snap_name)

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            method_endpoint="POST",
        )


class PostMetadataListingPage(BaseTestCases.EndpointLoggedInErrorHandling):
    def setUp(self):
        self.snap_id = "complexId"
        snap_name = "test-snap"
        endpoint_url = "/{}/listing".format(snap_name)
        api_url = (
            "https://dashboard.snapcraft.io/dev/api/"
            "snaps/{}/binary-metadata?conflict_on_update=true"
        ).format(self.snap_id)

        changes = {"images": None}
        data = dict(snap_id=self.snap_id, changes=json.dumps(changes))

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            method_endpoint="POST",
            api_url=api_url,
            method_api="GET",
            data=data,
        )


class PostBinaryMetadataErrorListingPage(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        responses.reset()

        self.snap_id = "complexId"
        snap_name = "test-snap"
        endpoint_url = "/{}/listing".format(snap_name)
        binary_url = (
            "https://dashboard.snapcraft.io/dev/api/"
            "snaps/{}/binary-metadata?conflict_on_update=true"
        ).format(self.snap_id)

        responses.add(responses.GET, binary_url, json=[], status=200)
        payload = {
            "error_list": [
                {"code": "this-is-a-code", "message": "Great error message"}
            ]
        }
        responses.add(responses.PUT, binary_url, json=payload, status=400)

        api_url = "https://dashboard.snapcraft.io/dev/api/snaps/info/{}"
        api_url = api_url.format(snap_name)

        changes = {
            "images": [
                {
                    "file": {},
                    "url": "blob:this_is_a_blob",
                    "name": "blue.png",
                    "type": "icon",
                    "status": "new",
                }
            ]
        }

        data = dict(
            icon=[(io.BytesIO(b"my file contents"), "blue.png")],
            snap_id=self.snap_id,
            changes=json.dumps(changes),
        )

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            method_endpoint="POST",
            api_url=api_url,
            method_api="GET",
            data=data,
        )


class PostBinaryMetadataListingPage(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        responses.reset()

        self.snap_id = "complexId"
        snap_name = "test-snap"
        endpoint_url = "/{}/listing".format(snap_name)
        api_url = (
            "https://dashboard.snapcraft.io/dev/api/"
            "snaps/{}/binary-metadata?conflict_on_update=true"
        ).format(self.snap_id)

        responses.add(responses.GET, api_url, json=[], status=200)

        changes = {"images": []}
        data = dict(snap_id=self.snap_id, changes=json.dumps(changes))

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            method_endpoint="POST",
            api_url=api_url,
            method_api="PUT",
            data=data,
        )

    @responses.activate
    def test_upload_new_screenshot(self):
        responses.add(
            responses.PUT, self.api_url, json={"totot": "toto"}, status=200
        )

        changes = {
            "images": [
                {
                    "file": {},
                    "url": "blob:this_is_a_blob",
                    "name": "blue.png",
                    "type": "screenshot",
                    "status": "new",
                }
            ]
        }

        data = dict(
            screenshots=[(io.BytesIO(b"my file contents"), "blue.png")],
            snap_id=self.snap_id,
            changes=json.dumps(changes),
        )

        response = self.client.post(
            self.endpoint_url, content_type="multipart/form-data", data=data
        )

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual("GET", called.request.method)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

        called = responses.calls[1]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual("PUT", called.request.method)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

        self.assertIn(b'"key": "blue.png"', called.request.body)
        self.assertIn(b'"type": "screenshot"', called.request.body)
        self.assertIn(b'"filename": "blue.png"', called.request.body)
        hash_screenshot = (
            '"hash": '
            '"114d70ba7d04c76d8c217c970f99682025c89b1a6ffe91eb9045653b4b954eb9'
        )
        self.assertIn(
            bytes(hash_screenshot, encoding="utf-8"), called.request.body
        )

        assert response.status_code == 302
        assert response.location == self._get_location()

    @responses.activate
    def test_upload_new_icon(self):
        responses.add(responses.PUT, self.api_url, json={}, status=200)

        changes = {
            "images": [
                {
                    "file": {},
                    "url": "blob:this_is_a_blob",
                    "name": "blue.png",
                    "type": "icon",
                    "status": "new",
                }
            ]
        }

        data = dict(
            icon=[(io.BytesIO(b"my file contents"), "blue.png")],
            snap_id=self.snap_id,
            changes=json.dumps(changes),
        )

        response = self.client.post(
            self.endpoint_url, content_type="multipart/form-data", data=data
        )

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual("GET", called.request.method)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

        called = responses.calls[1]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual("PUT", called.request.method)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

        self.assertIn(b'"key": "blue.png"', called.request.body)
        self.assertIn(b'"type": "icon"', called.request.body)
        self.assertIn(b'"filename": "blue.png"', called.request.body)
        hash_screenshot = (
            '"hash": '
            '"114d70ba7d04c76d8c217c970f99682025c89b1a6ffe91eb9045653b4b954eb9'
        )
        self.assertIn(
            bytes(hash_screenshot, encoding="utf-8"), called.request.body
        )

        assert response.status_code == 302
        assert response.location == self._get_location()

    @responses.activate
    def test_upload_new_screenshot_with_existing_ones(self):
        responses.reset()

        current_screenshots = [
            {
                "url": "URL",
                "hash": "HASH",
                "type": "screenshot",
                "filename": "red.png",
            }
        ]
        responses.add(
            responses.GET, self.api_url, json=current_screenshots, status=200
        )
        responses.add(responses.PUT, self.api_url, json={}, status=200)

        changes = {
            "images": [
                {
                    "file": {},
                    "url": "blob:this_is_a_blob",
                    "name": "blue.png",
                    "type": "icon",
                    "status": "new",
                },
                {"url": "URL", "type": "screenshot", "status": "uploaded"},
            ]
        }

        data = dict(
            screenshots=[(io.BytesIO(b"my file contents"), "blue.png")],
            snap_id=self.snap_id,
            changes=json.dumps(changes),
        )

        response = self.client.post(
            self.endpoint_url, content_type="multipart/form-data", data=data
        )

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual("GET", called.request.method)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

        called = responses.calls[1]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual("PUT", called.request.method)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

        self.assertIn(b'"key": "blue.png"', called.request.body)
        self.assertIn(b'"type": "screenshot"', called.request.body)
        self.assertIn(b'"filename": "blue.png"', called.request.body)
        hash_screenshot = (
            '"hash": '
            '"114d70ba7d04c76d8c217c970f99682025c89b1a6ffe91eb9045653b4b954eb9'
        )
        self.assertIn(
            bytes(hash_screenshot, encoding="utf-8"), called.request.body
        )

        self.assertIn(b'"url": "URL"', called.request.body)
        self.assertIn(b'"hash": "HASH"', called.request.body)
        self.assertIn(b'"type": "screenshot"', called.request.body)
        self.assertIn(b'"filename": "red.png"', called.request.body)

        assert response.status_code == 302
        assert response.location == self._get_location()


if __name__ == "__main__":
    unittest.main()
