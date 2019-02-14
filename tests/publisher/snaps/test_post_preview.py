import json

import responses
from tests.publisher.endpoint_testing import BaseTestCases


class PostPreviewPageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = "/{}/preview".format(snap_name)

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            method_endpoint="POST",
        )


class PostPreviewPage(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        self.snap_id = "complexId"

        snap_name = "test-snap"
        endpoint_url = "/{}/preview".format(snap_name)
        api_url = (
            "https://dashboard.snapcraft.io/dev/api/" "snaps/info/{}"
        ).format(snap_name)

        super().setUp(
            snap_name=snap_name,
            api_url=api_url,
            endpoint_url=endpoint_url,
            method_api="GET",
            method_endpoint="POST",
        )

    @responses.activate
    def test_renders_template(self):
        responses.add(
            responses.GET,
            self.api_url,
            json={"publisher": {"display-name": "Test", "username": "test"}},
            status=200,
        )

        state = json.dumps({"snap_name": self.snap_name, "images": []})

        response = self.client.post(self.endpoint_url, data={"state": state})

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed("store/snap-details.html")
        self.assertContext("snap_name", self.snap_name)
        self.assertContext("is_preview", True)
        self.assertContext("screenshots", [])
        self.assertContext("icon_url", None)
        self.assertContext("videos", [])
        self.assertContext("package_name", self.snap_name)
