import responses
from tests.publisher.endpoint_testing import BaseTestCases


class PostReleasePageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = "/{}/releases".format(snap_name)

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            method_endpoint="POST",
        )


class PostDataReleasePage(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = "/{}/releases".format(snap_name)
        api_url = "https://dashboard.snapcraft.io/dev/api/account"
        self.release_api_url = (
            "https://dashboard.snapcraft.io/dev/api/snap-release/"
        )

        super().setUp(
            snap_name=snap_name,
            api_url=api_url,
            endpoint_url=endpoint_url,
            method_api="GET",
            method_endpoint="POST",
            json={snap_name: {}},
        )

    @responses.activate
    def test_not_a_collaborator(self):
        responses.add(
            responses.GET,
            self.api_url,
            json={"snaps": {"16": ["other-snap"]}},
            status=200,
        )

        response = self.client.post(
            self.endpoint_url,
            json={
                "name": self.snap_name,
                "revision": "1",
                "channels": ["stable"],
            },
        )

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)

        assert response.status_code == 400

    @responses.activate
    def test_page_not_found(self):
        responses.add(
            responses.GET,
            self.api_url,
            json={"snaps": {"16": [self.snap_name]}},
            status=200,
        )

        responses.add(
            responses.POST,
            self.release_api_url,
            json={"error_list": []},
            status=404,
        )

        response = self.client.post(
            self.endpoint_url,
            json={
                "name": self.snap_name,
                "revision": "1",
                "channels": ["stable"],
            },
        )

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[1]
        self.assertEqual(self.release_api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

        assert response.status_code == 404
        self.assert_template_used("404.html")

    @responses.activate
    def test_post_no_data(self):
        responses.add(
            responses.GET,
            self.api_url,
            json={"snaps": {"16": [self.snap_name]}},
            status=200,
        )

        response = self.client.post(self.endpoint_url)

        assert response.status_code == 400
        assert response.get_json() == {"errors": ["No changes were submitted"]}

    @responses.activate
    def test_post_data(self):
        responses.add(
            responses.GET,
            self.api_url,
            json={"snaps": {"16": [self.snap_name]}},
            status=200,
        )

        payload = {
            "success": True,
            "channel_map": [
                {
                    "info": "specific",
                    "version": "2.7",
                    "channel": "stable",
                    "revision": 1,
                },
                {"info": "none", "channel": "candidate"},
                {"info": "tracking", "channel": "beta"},
                {"info": "tracking", "channel": "edge"},
            ],
            "opened_channels": ["candidate"],
        }

        responses.add(
            responses.POST, self.release_api_url, json=payload, status=200
        )

        response = self.client.post(
            self.endpoint_url,
            json={
                "name": self.snap_name,
                "revision": "1",
                "channels": ["stable"],
            },
        )

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[1]
        self.assertEqual(self.release_api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

        assert response.json == payload

    @responses.activate
    def test_return_error(self):
        responses.add(
            responses.GET,
            self.api_url,
            json={"snaps": {"16": [self.snap_name]}},
            status=200,
        )

        payload = {"success": False, "errors": [{"name": ["message"]}]}

        responses.add(
            responses.POST, self.release_api_url, json=payload, status=400
        )

        response = self.client.post(
            self.endpoint_url,
            json={
                "name": self.snap_name,
                "revision": "1",
                "channels": ["stable"],
            },
        )

        assert response.json == payload
