import json

import responses
from tests.publisher.endpoint_testing import BaseTestCases


class PostSettingsPageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = "/{}/settings".format(snap_name)

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            method_endpoint="POST",
        )


class PostMetadataSettingsPage(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        self.snap_id = "complexId"

        snap_name = "test-snap"
        endpoint_url = "/{}/settings".format(snap_name)
        api_url = (
            "https://dashboard.snapcraft.io/dev/api/"
            "snaps/{}/metadata?conflict_on_update=true"
        ).format(self.snap_id)

        changes = {"contact": "contact-adress"}
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

        assert response.status_code == 302
        assert response.location == self._get_location()

    @responses.activate
    def test_update_invalid_field(self):
        response = self.client.post(
            self.endpoint_url,
            data={"changes": '{"dumb_field": "this is a dumb field"}'},
        )

        assert 0 == len(responses.calls)
        assert response.status_code == 302
        assert response.location == self._get_location()

    @responses.activate
    def test_update_valid_field(self):
        responses.add(responses.PUT, self.api_url, json={}, status=200)

        changes = {"contact": "contact-adress"}

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
        self.assertEqual(b'{"contact": "contact-adress"}', called.request.body)

        assert response.status_code == 302
        assert response.location == self._get_location()

    @responses.activate
    def test_return_error_update_one_field(self):
        metadata_payload = {
            "error_list": [{"code": "code", "message": "message"}]
        }

        responses.add(
            responses.PUT, self.api_url, json=metadata_payload, status=500
        )

        info_url = "https://dashboard.snapcraft.io/dev/api/snaps/info/{}"
        info_url = info_url.format(self.snap_name)

        payload = {
            "snap_id": self.snap_id,
            "title": "test snap",
            "snap_name": self.snap_name,
            "private": True,
            "unlisted": False,
            "price": 0,
            "store": "stotore",
            "keywords": [],
            "status": "published",
        }

        responses.add(responses.GET, info_url, json=payload, status=200)

        changes = {"private": True}

        response = self.client.post(
            self.endpoint_url,
            data={"changes": json.dumps(changes), "snap_id": self.snap_id},
        )

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )
        self.assertEqual(b'{"private": true}', called.request.body)
        called = responses.calls[1]
        self.assertEqual(info_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

        self.assertEqual(response.status_code, 200)
        self.assert_template_used("publisher/settings.html")

        self.assert_context("snap_id", self.snap_id)
        self.assert_context("snap_title", "test snap")
        self.assert_context("snap_name", self.snap_name)
        self.assert_context("private", True)
        self.assert_context("price", 0)
        self.assert_context("store", "stotore")
        self.assert_context("keywords", [])
        self.assert_context("status", "published")

    @responses.activate
    def test_return_error_udpate_all_field(self):
        metadata_payload = {
            "error_list": [{"code": "code", "message": "message"}]
        }

        responses.add(
            responses.PUT, self.api_url, json=metadata_payload, status=500
        )

        info_url = "https://dashboard.snapcraft.io/dev/api/snaps/info/{}"
        info_url = info_url.format(self.snap_name)

        payload = {
            "snap_id": self.snap_id,
            "title": "test snap",
            "snap_name": self.snap_name,
            "private": True,
            "unlisted": False,
            "public_metrics_enabled": False,
            "public_metrics_blacklist": True,
            "price": 0,
            "store": "stotore",
            "keywords": [],
            "status": "published",
        }

        responses.add(responses.GET, info_url, json=payload, status=200)

        changes = {"license": "newLicense", "private": False}

        response = self.client.post(
            self.endpoint_url,
            data={"changes": json.dumps(changes), "snap_id": self.snap_id},
        )

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )
        called = responses.calls[1]
        self.assertEqual(info_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

        self.assertEqual(response.status_code, 200)
        self.assert_template_used("publisher/settings.html")

        # Not updatable fields
        self.assert_context("snap_id", self.snap_id)
        self.assert_context("snap_title", "test snap")
        self.assert_context("snap_name", self.snap_name)
        self.assert_context("private", True)
        self.assert_context("price", 0)
        self.assert_context("store", "stotore")
        self.assert_context("keywords", [])
        self.assert_context("status", "published")

    @responses.activate
    def test_return_error_invalid_field(self):
        metadata_payload = {
            "error_list": [
                {
                    "code": "invalid-field",
                    "message": "error message",
                    "extra": {"name": "description"},
                }
            ]
        }

        responses.add(
            responses.PUT, self.api_url, json=metadata_payload, status=500
        )

        info_url = "https://dashboard.snapcraft.io/dev/api/snaps/info/{}"
        info_url = info_url.format(self.snap_name)

        payload = {
            "snap_id": self.snap_id,
            "title": "test snap",
            "snap_name": self.snap_name,
            "summary": "This is a summary",
            "description": "This is a description",
            "license": "license",
            "media": [],
            "publisher": {"display-name": "The publisher"},
            "private": True,
            "unlisted": False,
            "contact": "contact adress",
            "website": "website_url",
            "price": 0,
            "store": "stotore",
            "keywords": [],
            "status": "published",
        }

        responses.add(responses.GET, info_url, json=payload, status=200)

        changes = {"description": "This is an updated description"}

        response = self.client.post(
            self.endpoint_url,
            data={"changes": json.dumps(changes), "snap_id": self.snap_id},
        )

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )
        called = responses.calls[1]
        self.assertEqual(info_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

        self.assertEqual(response.status_code, 200)
        self.assert_template_used("publisher/settings.html")

        self.assert_context("field_errors", {"description": "error message"})
