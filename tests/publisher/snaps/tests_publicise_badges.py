import responses
from tests.publisher.endpoint_testing import BaseTestCases


class PublicisePageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = "/{}/publicise/badges".format(snap_name)

        super().setUp(snap_name=snap_name, endpoint_url=endpoint_url)


class GetPubliciseBadgesPage(BaseTestCases.EndpointLoggedInErrorHandling):
    snap_payload = {
        "snap-id": "id",
        "name": "snapName",
        "default-track": "test",
        "snap": {
            "title": "Snap Title",
            "summary": "This is a summary",
            "description": "this is a description",
            "media": [],
            "license": "license",
            "prices": 0,
            "publisher": {
                "display-name": "Toto",
                "username": "toto",
                "validation": True,
            },
            "categories": [],
            "trending": False,
        },
        "channel-map": [],
    }

    def setUp(self):
        snap_name = "test-snap"

        api_url = "https://dashboard.snapcraft.io/dev/api/snaps/info/{}"
        api_url = api_url.format(snap_name)
        self.public_api_url = "".join(
            [
                "https://api.snapcraft.io/v2/",
                "snaps/info/",
                snap_name,
                "?fields=title,summary,description,license,contact,website,",
                "publisher,prices,media,download,version,created-at,"
                "confinement,categories,trending",
            ]
        )

        endpoint_url = "/{}/publicise/badges".format(snap_name)

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

        self.assertEqual(response.status_code, 404)
        self.assert_template_used("404.html")

    @responses.activate
    def test_publicise_logged_in(self):
        snap_name = "test-snap"

        payload = {
            "snap_id": "id",
            "title": "test snap",
            "private": False,
            "snap_name": snap_name,
            "keywords": [],
            "media": [],
            "publisher": {"display-name": "test"},
        }

        responses.add(responses.GET, self.api_url, json=payload, status=200)
        responses.add(
            responses.GET,
            self.public_api_url,
            json=self.snap_payload,
            status=200,
        )

        response = self.client.get(self.endpoint_url)

        self.check_call_by_api_url(responses.calls)

        self.assertEqual(response.status_code, 200)
        self.assert_template_used("publisher/publicise/github_badges.html")

        self.assert_context("snap_id", "id")
        self.assert_context("snap_title", "test snap")
        self.assert_context("snap_name", snap_name)

    @responses.activate
    def test_publicise_private_snap(self):
        snap_name = "test-snap"

        payload = {
            "snap_id": "id",
            "title": "test snap",
            "private": True,
            "snap_name": snap_name,
            "keywords": [],
            "media": [],
        }

        responses.add(responses.GET, self.api_url, json=payload, status=200)

        response = self.client.get(self.endpoint_url)

        self.check_call_by_api_url(responses.calls)

        self.assertEqual(response.status_code, 404)
        self.assert_template_used("404.html")
