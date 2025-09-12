import responses
from urllib.parse import urlencode
from flask_testing import TestCase
from webapp.app import create_app


EMPTY_EXTRA_DETAILS_PAYLOAD = {"aliases": None, "package_name": "vault"}


class GetDetailsPageTest(TestCase):
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
                                "media",
                                "download",
                                "version",
                                "created-at",
                                "confinement",
                                "categories",
                                "trending",
                                "unlisted",
                                "links",
                            ]
                        )
                    }
                ),
            ]
        )
        self.endpoint_url = "/" + self.snap_name
        self.api_url_details = "".join(
            [
                "https://api.snapcraft.io/api/v1/",
                "snaps/details/",
                self.snap_name,
                "?",
                urlencode({"fields": ",".join(["aliases"])}),
            ]
        )

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []

        return app

    def assert_not_in_context(self, name):
        try:
            self.get_context_variable(name)
        except Exception:
            # flask-testing throws exception if context doesn't have "name"
            # that's what we expect so we just return and let the test pass
            return
        # If we reach this point it means the variable IS in context
        self.fail(f"Context variable exists: {name}")

    @responses.activate
    def test_api_404(self):
        payload = {"error-list": [{"code": "resource-not-found"}]}
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
    def test_extra_details_404(self):
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
                "publisher": {
                    "display-name": "Toto",
                    "username": "toto",
                    "validation": True,
                },
                "categories": [{"name": "test"}],
                "trending": False,
                "unlisted": False,
                "links": {},
            },
            "channel-map": [
                {
                    "channel": {
                        "architecture": "amd64",
                        "name": "stable",
                        "risk": "stable",
                        "track": "latest",
                        "released-at": "2018-09-18T14:45:28.064633+00:00",
                    },
                    "created-at": "2018-09-18T14:45:28.064633+00:00",
                    "version": "1.0",
                    "confinement": "conf",
                    "download": {"size": 100000},
                }
            ],
        }
        extra_details_payload = {
            "error_list": [
                {
                    "code": "resource-not-found",
                    "message": "No snap named 'toto' found in series '16'.",
                }
            ],
            "errors": ["No snap named 'toto' found in series '16'."],
            "result": "error",
        }

        responses.add(
            responses.Response(
                method="GET", url=self.api_url, json=payload, status=200
            )
        )
        responses.add(
            responses.Response(
                method="GET",
                url=self.api_url_details,
                json=extra_details_payload,
                status=404,
            )
        )
        metrics_url = "https://api.snapcraft.io/api/v1/snaps/metrics"
        responses.add(
            responses.Response(
                method="POST", url=metrics_url, json={}, status=200
            )
        )

        response = self.client.get(self.endpoint_url)

        assert len(responses.calls) == 3
        assert responses.calls[0].request.url == self.api_url
        assert responses.calls[1].request.url == self.api_url_details
        assert responses.calls[2].request.url == metrics_url

        self.assert200(response)
        self.assert_not_in_context("aliases")
        self.assert_context("snap-id", "id")

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
                "publisher": {
                    "display-name": "Toto",
                    "username": "toto",
                    "validation": True,
                },
                "categories": [{"name": "test"}],
                "trending": False,
                "unlisted": False,
                "links": {},
            },
        }

        responses.add(
            responses.Response(
                method="GET", url=self.api_url, json=payload, status=200
            )
        )
        responses.add(
            responses.Response(
                method="GET",
                url=self.api_url_details,
                json=EMPTY_EXTRA_DETAILS_PAYLOAD,
                status=200,
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
                "publisher": {
                    "display-name": "Toto",
                    "username": "toto",
                    "validation": True,
                },
                "categories": [{"name": "test"}],
                "trending": False,
                "unlisted": False,
                "links": {},
            },
            "channel-map": [
                {
                    "channel": {
                        "architecture": "amd64",
                        "name": "stable",
                        "risk": "stable",
                        "track": "latest",
                        "released-at": "2018-09-18T14:45:28.064633+00:00",
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
        responses.add(
            responses.Response(
                method="GET",
                url=self.api_url_details,
                json=EMPTY_EXTRA_DETAILS_PAYLOAD,
                status=200,
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
            s["publisher"] = {"nickname": "toto", "fullname": "Totinio"}
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
                "publisher": {
                    "display-name": "Toto",
                    "username": "toto",
                    "validation": True,
                },
                "categories": [{"name": "test"}],
                "trending": False,
                "unlisted": False,
                "links": {},
            },
            "channel-map": [
                {
                    "channel": {
                        "architecture": "amd64",
                        "name": "stable",
                        "risk": "stable",
                        "track": "latest",
                        "released-at": "2018-09-18T14:45:28.064633+00:00",
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
        responses.add(
            responses.Response(
                method="GET",
                url=self.api_url_details,
                json=EMPTY_EXTRA_DETAILS_PAYLOAD,
                status=200,
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
                "publisher": {
                    "display-name": "Toto",
                    "username": "toto",
                    "validation": True,
                },
                "categories": [{"name": "test"}],
                "trending": False,
                "unlisted": False,
                "links": {},
            },
            "channel-map": [
                {
                    "channel": {
                        "architecture": "amd64",
                        "name": "stable",
                        "risk": "stable",
                        "track": "latest",
                        "released-at": "2018-09-18T14:45:28.064633+00:00",
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
        responses.add(
            responses.Response(
                method="GET",
                url=self.api_url_details,
                json=EMPTY_EXTRA_DETAILS_PAYLOAD,
                status=200,
            )
        )

        metrics_url = "https://api.snapcraft.io/api/v1/snaps/metrics"
        responses.add(
            responses.Response(
                method="POST", url=metrics_url, json={}, status=200
            )
        )

        with self.client.session_transaction() as s:
            s["publisher"] = {"nickname": "greg"}

        response = self.client.get(self.endpoint_url)

        assert response.status_code == 200
        self.assert_context("is_users_snap", False)

    @responses.activate
    def test_extra_details(self):
        payload = {
            "snap-id": "toto_id",
            "name": "toto",
            "default-track": None,
            "snap": {
                "title": "Snap Title",
                "summary": "This is a summary",
                "description": "this is a description",
                "media": [],
                "license": "license",
                "publisher": {
                    "display-name": "Toto",
                    "username": "toto",
                    "validation": True,
                },
                "categories": [{"name": "test"}],
                "trending": False,
                "unlisted": False,
                "links": {},
            },
            "channel-map": [
                {
                    "channel": {
                        "architecture": "amd64",
                        "name": "stable",
                        "risk": "stable",
                        "track": "latest",
                        "released-at": "2018-09-18T14:45:28.064633+00:00",
                    },
                    "created-at": "2018-09-18T14:45:28.064633+00:00",
                    "version": "1.0",
                    "confinement": "conf",
                    "download": {"size": 100000},
                }
            ],
        }
        payload_extra_details = {
            "aliases": [
                {"name": "nu", "target": "nu"},
                {
                    "name": "nu_plugin_stress_internals",
                    "target": "nu-plugin-stress-internals",
                },
                {"name": "nu_plugin_gstat", "target": "nu-plugin-gstat"},
                {"name": "nu_plugin_formats", "target": "nu-plugin-formats"},
                {"name": "nu_plugin_polars", "target": "nu-plugin-polars"},
            ],
            "package_name": "toto",
        }

        responses.add(
            responses.Response(
                method="GET", url=self.api_url, json=payload, status=200
            )
        )
        responses.add(
            responses.Response(
                method="GET",
                url=self.api_url_details,
                json=payload_extra_details,
                status=200,
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
        self.assert_context(
            "aliases",
            [
                ["toto.nu", "nu"],
                [
                    "toto.nu-plugin-stress-internals",
                    "nu_plugin_stress_internals",
                ],
                ["toto.nu-plugin-gstat", "nu_plugin_gstat"],
                ["toto.nu-plugin-formats", "nu_plugin_formats"],
                ["toto.nu-plugin-polars", "nu_plugin_polars"],
            ],
        )
