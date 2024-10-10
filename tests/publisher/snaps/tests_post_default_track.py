import responses
from tests.publisher.endpoint_testing import BaseTestCases


class PostDefaultTrackNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = "/{}/releases/default-track".format(snap_name)

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            method_endpoint="POST",
        )


class PostDefaultTrackGetSnapId(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = "/{}/releases/default-track".format(snap_name)
        json = {"default-track": "test"}

        api_url = "https://dashboard.snapcraft.io/dev/api/snaps/info/{}"
        api_url = api_url.format(snap_name)

        super().setUp(
            snap_name=snap_name,
            api_url=api_url,
            endpoint_url=endpoint_url,
            method_api="GET",
            method_endpoint="POST",
            json=json,
        )

    @responses.activate
    def test_page_not_found(self):
        payload = {"error_list": []}
        responses.add(responses.GET, self.api_url, json=payload, status=404)

        response = self.client.post(self.endpoint_url, json=self.json)
        self.check_call_by_api_url(responses.calls)

        assert response.status_code == 404
        self.assert_template_used("404.html")

    @responses.activate
    def test_error_4xx(self):
        payload = {"error_list": []}
        responses.add(responses.GET, self.api_url, json=payload, status=400)

        response = self.client.post(self.endpoint_url, json=self.json)
        self.check_call_by_api_url(responses.calls)

        assert response.status_code == 400
        assert response.get_json() == []


class PostDefaultTrack(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        snap_name = "test-snap"
        snap_id = "test_id"
        endpoint_url = "/{}/releases/default-track".format(snap_name)
        api_url = (
            "https://dashboard.snapcraft.io/dev/api/"
            "snaps/{}/metadata?conflict_on_update=true"
        ).format(snap_id)

        json = {"default-track": "test"}

        api_info_url = "https://dashboard.snapcraft.io/dev/api/snaps/info/{}"
        api_info_url = api_info_url.format(snap_name)
        responses.add(
            method=responses.GET,
            url=api_info_url,
            json={"snap_id": snap_id},
            status=200,
        )

        super().setUp(
            snap_name=snap_name,
            api_url=api_url,
            endpoint_url=endpoint_url,
            method_api="PUT",
            method_endpoint="POST",
            json=json,
        )

    @responses.activate
    def test_page_not_found(self):
        payload = {"error_list": []}
        responses.add(responses.PUT, self.api_url, json=payload, status=404)

        response = self.client.post(self.endpoint_url, json=self.json)
        self.check_call_by_api_url(responses.calls)

        assert response.status_code == 404
        self.assert_template_used("404.html")

    def test_post_no_data(self):
        response = self.client.post(self.endpoint_url, json={})

        assert response.status_code == 400
        assert response.get_json() == {}

    @responses.activate
    def test_post_data(self):
        payload = {}

        responses.add(responses.PUT, self.api_url, json=payload, status=200)

        response = self.client.post(self.endpoint_url, json=self.json)
        self.check_call_by_api_url(responses.calls)

        result = {"success": True}
        self.assertEqual(response.json, result)

    @responses.activate
    def test_return_error(self):
        payload = {"error_list": [{"code": "code", "name": ["message"]}]}

        responses.add(responses.PUT, self.api_url, json=payload, status=400)

        response = self.client.post(self.endpoint_url, json=self.json)
        self.check_call_by_api_url(responses.calls)

        expected_response = {
            "errors": [{"code": "code", "name": ["message"]}],
            "success": False,
        }
        self.assertEqual(response.json, expected_response)

    @responses.activate
    def test_error_4xx(self):
        payload = {"error_list": []}
        responses.add(responses.PUT, self.api_url, json=payload, status=400)

        response = self.client.post(self.endpoint_url, json=self.json)
        self.check_call_by_api_url(responses.calls)

        expected_response = {"errors": [], "success": False}
        assert response.status_code == 400
        assert response.get_json() == expected_response
