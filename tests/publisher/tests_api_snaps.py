from flask import json
import responses
from tests.publisher.endpoint_testing import BaseTestCases

# Make sure tests fail on stray responses.
responses.mock.assert_all_requests_are_fired = True


class AccountSnapsNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        endpoint_url = "/snaps/api/snap-count"

        super().setUp(snap_name=None, endpoint_url=endpoint_url)


class AccountSnapsPage(BaseTestCases.EndpointLoggedInErrorHandling):
    def setUp(self):
        api_url = "https://dashboard.snapcraft.io/dev/api/account"
        endpoint_url = "/snaps/api/snap-count"

        super().setUp(
            snap_name=None,
            endpoint_url=endpoint_url,
            method_endpoint="GET",
            api_url=api_url,
            method_api="GET",
        )

    @responses.activate
    def test_no_snaps(self):
        payload = {"snaps": {"16": {}}}
        responses.add(responses.GET, self.api_url, json=payload, status=200)

        response = self.client.get("/snaps/api/snap-count")
        self.assertEqual(200, response.status_code)
        # Add pyQuery basic context checks

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

        assert response.status_code == 200
        data = json.loads(response.get_data())
        assert data["count"] == 0

    @responses.activate
    def test_uploaded_snaps(self):
        payload = {
            "snaps": {
                "16": {
                    "test": {
                        "status": "Approved",
                        "snap-name": "test",
                        "latest_revisions": [
                            {
                                "test": "test",
                                "since": "2018-01-01T00:00:00Z",
                                "channels": [],
                            }
                        ],
                    }
                }
            }
        }
        responses.add(responses.GET, self.api_url, json=payload, status=200)

        response = self.client.get("/snaps/api/snap-count")
        self.assertEqual(200, response.status_code)
        # Add pyQuery basic context checks

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

        assert response.status_code == 200
        data = json.loads(response.get_data())
        assert data["count"] == 1

    @responses.activate
    def test_uploaded_snaps_registered_snaps(self):
        payload = {
            "snaps": {
                "16": {
                    "test": {
                        "status": "Approved",
                        "snap-name": "test",
                        "latest_revisions": [
                            {
                                "test": "test",
                                "since": "2018-01-01T00:00:00Z",
                                "channels": [],
                            }
                        ],
                    },
                    "test2": {
                        "status": "Approved",
                        "snap-name": "test2",
                        "latest_revisions": [],
                    },
                }
            }
        }
        responses.add(responses.GET, self.api_url, json=payload, status=200)

        response = self.client.get("/snaps/api/snap-count")
        self.assertEqual(200, response.status_code)
        # Add pyQuery basic context checks

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

        assert response.status_code == 200
        data = json.loads(response.get_data())
        assert data["count"] == 1

    @responses.activate
    def test_revoked_snaps(self):
        payload = {
            "snaps": {
                "16": {
                    "test": {
                        "status": "Approved",
                        "snap-name": "test",
                        "latest_revisions": [
                            {
                                "test": "test",
                                "since": "2018-01-01T00:00:00Z",
                                "channels": [],
                            }
                        ],
                    },
                    "test2": {
                        "status": "Approved",
                        "snap-name": "test2",
                        "latest_revisions": [],
                    },
                    "test3": {
                        "status": "Revoked",
                        "snap-name": "test",
                        "latest_revisions": [
                            {
                                "test": "test",
                                "since": "2018-01-01T00:00:00Z",
                                "channels": [],
                            }
                        ],
                    },
                    "test4": {
                        "status": "Revoked",
                        "snap-name": "test2",
                        "latest_revisions": [],
                    },
                }
            }
        }
        responses.add(responses.GET, self.api_url, json=payload, status=200)

        response = self.client.get("/snaps/api/snap-count")
        self.assertEqual(200, response.status_code)
        # Add pyQuery basic context checks

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )

        assert response.status_code == 200
        data = json.loads(response.get_data())
        assert data["count"] == 1
