import responses
from tests.publisher.endpoint_testing import BaseTestCases


class GetReleaseHistoryJsonNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = "/{}/releases/json".format(snap_name)

        super().setUp(snap_name=snap_name, endpoint_url=endpoint_url)


class GetReleasesHistoryJson(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        snap_name = "test-snap"

        api_url = (
            "https://dashboard.snapcraft.io/api/v2/snaps/{}"
            + "/releases?page=1"
        )
        api_url = api_url.format(snap_name)
        endpoint_url = "/{}/releases/json".format(snap_name)

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            api_url=api_url,
            method_endpoint="GET",
            method_api="GET",
        )

    @responses.activate
    def test_get_releases(self):
        responses.add(responses.GET, self.api_url, json={}, status=200)

        response = self.client.get(self.endpoint_url)

        self.check_call_by_api_url(responses.calls)
        self.assertEqual(response.status_code, 200)
        assert response.json == {}

    @responses.activate
    def test_404(self):
        payload = {"error_list": []}
        responses.add(responses.GET, self.api_url, json=payload, status=404)

        response = self.client.get(self.endpoint_url)

        self.check_call_by_api_url(responses.calls)
        self.assertEqual(response.status_code, 404)

    @responses.activate
    def test_5XX(self):
        payload = {"error_list": []}
        responses.add(responses.GET, self.api_url, json=payload, status=500)

        response = self.client.get(self.endpoint_url)

        self.check_call_by_api_url(responses.calls)
        self.assertEqual(response.status_code, 400)
