import responses
from tests.endpoint_testing import BaseTestCases


class GetReleasePageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        snap_name = 'test-snap'
        endpoint_url = '/account/snaps/{}/release'.format(
            snap_name)

        super().setUp(
            snap_name=None,
            endpoint_url=endpoint_url)


class GetReleaseSnapIdPage(
        BaseTestCases.EndpointLoggedInErrorHandling):
    def setUp(self):
        snap_name = 'test-snap'
        api_url = 'https://dashboard.snapcraft.io/dev/api/snaps/info/{}'
        api_url = api_url.format(
            snap_name
        )
        endpoint_url = '/account/snaps/{}/release'.format(snap_name)
        super().setUp(
            snap_name=snap_name,
            api_url=api_url,
            endpoint_url=endpoint_url)


class GetReleasePage(
        BaseTestCases.EndpointLoggedInErrorHandling):
    def setUp(self):
        snap_name = 'test-snap'
        snap_id = 'complexId'

        info_url = 'https://dashboard.snapcraft.io/dev/api/snaps/info/{}'
        self.info_url = info_url.format(
            snap_name
        )
        payload = {
            'snap_id': 'complexId',
        }

        responses.add(
            responses.GET, self.info_url,
            json=payload, status=200)

        api_url = 'https://dashboard.snapcraft.io/dev/api/snaps/{}/status'

        endpoint_url = '/account/snaps/{}/release'.format(snap_name)
        api_url = api_url.format(
            snap_id
        )
        super().setUp(
            snap_name=snap_name,
            api_url=api_url,
            endpoint_url=endpoint_url)

    @responses.activate
    def test_release(self):
        responses.add(
            responses.GET, self.api_url,
            json={}, status=200)
        response = self.client.get(self.endpoint_url)

        self.assertEqual(response.status_code, 200)
        self.assert_template_used('publisher/release.html')
