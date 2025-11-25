import json
import responses
from tests.publisher.endpoint_testing import BaseTestCases

# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class AccountSnapsMetricsNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = "/snaps/metrics/json"
        super().setUp(
            snap_name=None, endpoint_url=endpoint_url, method_endpoint="POST"
        )


class AccountSnapsMetrics(BaseTestCases.BaseAppTesting):
    def setUp(self):
        api_url = "https://dashboard.snapcraft.io/dev/api/snaps/metrics"
        endpoint_url = "/snaps/metrics/json"
        super().setUp(
            snap_name=None, endpoint_url=endpoint_url, api_url=api_url
        )
        self.authorization = self._log_in(self.client)

    @responses.activate
    def test_metrics(self):
        metrics_payload = {
            "metrics": [
                {
                    "snap_id": "1",
                    "status": "OK",
                    "series": [
                        {"values": [0, 3], "name": "new"},
                        {"values": [2, 3], "name": "lost"},
                        {"values": [9, 6], "name": "continued"},
                    ],
                    "buckets": ["2018-04-13", "2018-04-20"],
                },
                {
                    "snap_id": "2",
                    "status": "NODATA",
                    "series": [],
                    "buckets": [],
                },
            ]
        }

        responses.add(
            responses.POST, self.api_url, json=metrics_payload, status=200
        )

        payload = {"1": "test1", "2": "test2"}
        headers = {"content-type": "application/json"}
        response = self.client.post(
            self.endpoint_url, data=json.dumps(payload), headers=headers
        )

        expected_response = {
            "buckets": ["2018-04-13", "2018-04-20"],
            "snaps": [
                {
                    "id": "1",
                    "name": None,
                    "series": [
                        {"name": "new", "values": [0, 3]},
                        {"name": "lost", "values": [2, 3]},
                        {"name": "continued", "values": [9, 6]},
                    ],
                }
            ],
        }

        self.assertEqual(200, response.status_code)
        self.assertEqual(expected_response, response.json)
        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

    @responses.activate
    def test_metrics_no_payload(self):
        headers = {"content-type": "application/json"}
        response = self.client.post(self.endpoint_url, headers=headers)

        expected_response = {"error": "Please provide a list of snaps"}

        self.assertEqual(500, response.status_code)
        self.assertEqual(expected_response, response.json)

    @responses.activate
    def test_metrics_bad_id_payload(self):
        headers = {"content-type": "application/json"}

        metrics_payload = {
            "error_list": [{"message": "Error", "code": "invalid"}]
        }

        responses.add(
            responses.POST, self.api_url, json=metrics_payload, status=400
        )

        payload = {"badid": "badname"}
        response = self.client.post(
            self.endpoint_url, data=json.dumps(payload), headers=headers
        )

        expected_response = {
            "error": "An error occured while fetching metrics"
        }

        self.assertEqual(500, response.status_code)
        self.assertEqual(expected_response, response.json)
