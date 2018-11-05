import responses
from tests.publisher.endpoint_testing import BaseTestCases


class PostCloseChannelPageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = "/{}/releases/close-channel".format(snap_name)

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            method_endpoint="POST",
        )


class PostDataCloseChannelGetSnapIdPage(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = "/{}/releases/close-channel".format(snap_name)
        json = {"info": "json"}

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


class PostDataCloseChannelPage(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        snap_name = "test-snap"
        snap_id = "test_id"
        endpoint_url = "/{}/releases/close-channel".format(snap_name)
        api_url = (
            "https://dashboard.snapcraft.io/dev/api/"
            "snaps/{}/close".format(snap_id)
        )
        json = {"info": "json"}

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
            method_api="POST",
            method_endpoint="POST",
            json=json,
        )

    @responses.activate
    def test_page_not_found(self):
        payload = {"error_list": []}
        responses.add(responses.POST, self.api_url, json=payload, status=404)

        response = self.client.post(self.endpoint_url, json=self.json)
        self.check_call_by_api_url(responses.calls)

        assert response.status_code == 404
        self.assert_template_used("404.html")

    def test_post_no_data(self):
        response = self.client.post(self.endpoint_url)

        assert response.status_code == 200
        assert response.get_json() == {}

    @responses.activate
    def test_post_data(self):
        payload = {}

        responses.add(responses.POST, self.api_url, json=payload, status=200)

        response = self.client.post(self.endpoint_url, json=self.json)
        self.check_call_by_api_url(responses.calls)

        result = {"success": True}
        assert response.json == result

    @responses.activate
    def test_return_error(self):
        payload = {"error_list": [{"code": "code", "name": ["message"]}]}

        responses.add(responses.POST, self.api_url, json=payload, status=400)

        response = self.client.post(self.endpoint_url, json=self.json)
        self.check_call_by_api_url(responses.calls)

        expected_response = {
            "errors": [{"code": "code", "name": ["message"]}],
            "success": False,
        }
        assert response.json == expected_response

    @responses.activate
    def test_error_4xx(self):
        payload = {"error_list": []}
        responses.add(responses.POST, self.api_url, json=payload, status=400)

        response = self.client.post(self.endpoint_url, json=self.json)
        self.check_call_by_api_url(responses.calls)

        expected_response = {"errors": [], "success": False}
        assert response.status_code == 400
        assert response.get_json() == expected_response
