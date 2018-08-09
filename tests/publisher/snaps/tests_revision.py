import responses

from tests.publisher.endpoint_testing import BaseTestCases


class RevisionHistoryPageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = '/account/snaps/{}/release'.format(snap_name)

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url)


class GetRevisionGetInfoPage(
        BaseTestCases.EndpointLoggedInErrorHandling):
    def setUp(self):
        snap_name = "test-snap"

        api_url = (
            'https://dashboard.snapcraft.io/api/v2/snaps/{}' +
            '/releases?page=1&size=100'
        )
        api_url = api_url.format(
            snap_name
        )
        endpoint_url = '/account/snaps/{}/release'.format(snap_name)

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            method_endpoint='GET',
            api_url=api_url,
            method_api='GET'
        )


class GetRevisionHistory(
        BaseTestCases.EndpointLoggedInErrorHandling):

    def setUp(self):
        snap_name = "test-snap"

        api_url = (
            'https://dashboard.snapcraft.io/api/v2/snaps/{}' +
            '/releases?page=1&size=100'
        )
        api_url = api_url.format(
            snap_name
        )
        endpoint_url = '/account/snaps/{}/release'.format(snap_name)

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            api_url=api_url,
            method_endpoint='GET',
            method_api='GET'
        )

    @responses.activate
    def test_get_revision(self):
        responses.add(
            responses.GET, self.api_url,
            json={}, status=200)

        response = self.client.get(
            self.endpoint_url,
        )

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.api_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        self.assertEqual(response.status_code, 200)
        self.assert_template_used('publisher/release-history.html')
        self.assert_context('snap_name', self.snap_name)
        self.assert_context('release_history', {})
