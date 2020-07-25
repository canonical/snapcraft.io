import responses
from urllib.parse import urlencode
from flask_testing import TestCase
from webapp.app import create_app


class GetDetailsPageTest(TestCase):
    render_templates = False

    def setUp(self):
        self.snap_name = "toto"
        self.api_url = "".join(
            [
                "https://api.snapcraft.io/v2/",
                "snaps/info/",
                self.snap_name,
                "?",
                urlencode(
                    {
                        "fields": ",".join(
                            [
                                "title",
                                "summary",
                                "description",
                                "license",
                                "contact",
                                "website",
                                "publisher",
                                "prices",
                                "media",
                                "download",
                                "version",
                                "created-at",
                                "confinement",
                                "categories",
                                "trending",
                                "unlisted",
                            ]
                        )
                    }
                ),
            ]
        )
        self.endpoint_url = "/" + self.snap_name

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []

        return app

    @responses.activate
    def test_api_404(self):
        payload = {"error-list": []}
        responses.add(
            responses.Response(
                method="GET", url=self.api_url, json=payload, status=404
            )
        )

        response = self.client.get(self.endpoint_url)

        assert len(responses.calls) == 1
        called = responses.calls[0]
        assert called.request.url == self.api_url

        assert response.status_code == 404

    @responses.activate
    def test_api_500(self):
        payload = {"error-list": []}
        responses.add(
            responses.Response(
                method="GET", url=self.api_url, json=payload, status=500
            )
        )

        response = self.client.get(self.endpoint_url)

        assert len(responses.calls) == 1
        called = responses.calls[0]
        assert called.request.url == self.api_url

        assert response.status_code == 502

    @responses.activate
    def test_api_500_no_answer(self):
        responses.add(
            responses.Response(method="GET", url=self.api_url, status=500)
        )

        response = self.client.get(self.endpoint_url)

        assert len(responses.calls) == 1
        called = responses.calls[0]
        assert called.request.url == self.api_url

        assert response.status_code == 502

    @responses.activate
    def test_no_channel_map(self):
        payload = {
            "snap-id": "id",
            "name": "snapName",
            "default-track": None,
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
                "categories": [{"name": "test"}],
                "trending": False,
                "unlisted": False,
            },
        }

        responses.add(
            responses.Response(
                method="GET", url=self.api_url, json=payload, status=200
            )
        )

        response = self.client.get(self.endpoint_url)

        assert response.status_code == 404

    @responses.activate
    def test_user_connected(self):
        payload = {
            "snap-id": "id",
            "name": "toto",
            "default-track": None,
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
                "categories": [{"name": "test"}],
                "trending": False,
                "unlisted": False,
            },
            "channel-map": [
                {
                    "channel": {
                        "architecture": "amd64",
                        "name": "stable",
                        "risk": "stable",
                        "track": "latest",
                    },
                    "created-at": "2018-09-18T14:45:28.064633+00:00",
                    "version": "1.0",
                    "confinement": "conf",
                    "download": {"size": 100000},
                }
            ],
        }

        responses.add(
            responses.Response(
                method="GET", url=self.api_url, json=payload, status=200
            )
        )

        metrics_url = "https://api.snapcraft.io/api/v1/snaps/metrics"
        responses.add(
            responses.Response(
                method="POST", url=metrics_url, json={}, status=200
            )
        )

        with self.client.session_transaction() as s:
            # make test session 'authenticated'
            s["openid"] = {"nickname": "toto", "fullname": "Totinio"}
            s["macaroon_root"] = "test"
            s["macaroon_discharge"] = "test"
            # mock test user snaps list
            s["user_snaps"] = {"toto": {"snap-id": "test"}}

        response = self.client.get(self.endpoint_url)

        self.assert200(response)
        self.assert_context("is_users_snap", True)

    @responses.activate
    def test_user_not_connected(self):
        payload = {
            "snap-id": "id",
            "name": "snapName",
            "default-track": None,
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
                "categories": [{"name": "test"}],
                "trending": False,
                "unlisted": False,
            },
            "channel-map": [
                {
                    "channel": {
                        "architecture": "amd64",
                        "name": "stable",
                        "risk": "stable",
                        "track": "latest",
                    },
                    "created-at": "2018-09-18T14:45:28.064633+00:00",
                    "version": "1.0",
                    "confinement": "conf",
                    "download": {"size": 100000},
                }
            ],
        }

        responses.add(
            responses.Response(
                method="GET", url=self.api_url, json=payload, status=200
            )
        )

        metrics_url = "https://api.snapcraft.io/api/v1/snaps/metrics"
        responses.add(
            responses.Response(
                method="POST", url=metrics_url, json={}, status=200
            )
        )

        response = self.client.get(self.endpoint_url)

        assert response.status_code == 200
        self.assert_context("is_users_snap", False)

    @responses.activate
    def test_user_connected_on_not_own_snap(self):
        payload = {
            "snap-id": "id",
            "name": "snapName",
            "default-track": None,
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
                "categories": [{"name": "test"}],
                "trending": False,
                "unlisted": False,
            },
            "channel-map": [
                {
                    "channel": {
                        "architecture": "amd64",
                        "name": "stable",
                        "risk": "stable",
                        "track": "latest",
                    },
                    "created-at": "2018-09-18T14:45:28.064633+00:00",
                    "version": "1.0",
                    "confinement": "conf",
                    "download": {"size": 100000},
                }
            ],
        }

        responses.add(
            responses.Response(
                method="GET", url=self.api_url, json=payload, status=200
            )
        )

        metrics_url = "https://api.snapcraft.io/api/v1/snaps/metrics"
        responses.add(
            responses.Response(
                method="POST", url=metrics_url, json={}, status=200
            )
        )

        with self.client.session_transaction() as s:
            s["openid"] = {"nickname": "greg"}

        response = self.client.get(self.endpoint_url)

        assert response.status_code == 200
        self.assert_context("is_users_snap", False)
