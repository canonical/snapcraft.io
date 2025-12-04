import responses
from urllib.parse import urlencode
from webapp.app import create_app
from tests.base_test_cases import BaseFlaskTestCase
from unittest.mock import patch
from cache.cache_utility import redis_cache

POPULAR_PATH = "webapp.store.views.snap_recommendations.get_popular"
RECENT_PATH = "webapp.store.views.snap_recommendations.get_recent"
TREND_PATH = "webapp.store.views.snap_recommendations.get_trending"
TOP_PATH = "webapp.store.views.snap_recommendations.get_top_rated"
CATEGORIES_PATH = "webapp.store.views.device_gateway.get_categories"


EMPTY_EXTRA_DETAILS_PAYLOAD = {"aliases": None, "package_name": "vault"}
SNAP_PAYLOAD = {
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
            "revision": "rev-123",
        }
    ],
}


class GetDetailsPageTest(BaseFlaskTestCase):
    def setUp(self):
        super().setUp()
        self.snap_name = "toto"
        self.snap_id = "id"
        self.revision = "rev-123"
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
                                "revision",
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
        self.api_url_sboms = "".join(
            [
                "https://api.snapcraft.io/api/v1/",
                "sboms/download/",
                f"sbom_snap_{self.snap_id}_{self.revision}.spdx2.3.json",
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
    def test_has_sboms_success(self):
        payload = SNAP_PAYLOAD

        responses.add(
            responses.Response(
                method="GET", url=self.api_url, json=payload, status=200
            )
        )
        responses.add(
            responses.Response(
                method="HEAD", url=self.api_url_sboms, json={}, status=200
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

    @responses.activate
    def test_has_sboms_error(self):
        payload = SNAP_PAYLOAD

        responses.add(
            responses.Response(
                method="GET", url=self.api_url, json=payload, status=200
            )
        )
        responses.add(
            responses.Response(
                method="HEAD", url=self.api_url_sboms, json={}, status=404
            )
        )

        metrics_url = "https://api.snapcraft.io/api/v1/snaps/metrics"
        responses.add(
            responses.Response(
                method="POST", url=metrics_url, json={}, status=200
            )
        )

        response = self.client.head(self.api_url_sboms)

        assert response.status_code == 404

    @responses.activate
    def test_api_404(self):
        payload = {"error-list": [{"code": "resource-not-found"}]}
        responses.add(
            responses.Response(
                method="GET", url=self.api_url, json=payload, status=404
            )
        )

        response = self.client.get(self.endpoint_url)

        called = responses.calls[0]
        assert called.request.url == self.api_url
        assert len(responses.calls) == 1

        assert response.status_code == 404

    @responses.activate
    def test_extra_details_error(self):
        payload = SNAP_PAYLOAD
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
        responses.add(
            responses.Response(
                method="HEAD", url=self.api_url_sboms, json={}, status=200
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
        payload = SNAP_PAYLOAD

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
        responses.add(
            responses.Response(
                method="HEAD", url=self.api_url_sboms, json={}, status=200
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
        payload = SNAP_PAYLOAD

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
        responses.add(
            responses.Response(
                method="HEAD", url=self.api_url_sboms, json={}, status=200
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
        payload = SNAP_PAYLOAD

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
        responses.add(
            responses.Response(
                method="HEAD", url=self.api_url_sboms, json={}, status=200
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
        payload = SNAP_PAYLOAD
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
        responses.add(
            responses.Response(
                method="HEAD", url=self.api_url_sboms, json={}, status=200
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

    @responses.activate
    def test_explore_uses_redis_cache(self):
        """When Redis has cached explore data, the recommendation APIs
        and device gateway should not be called and the view should
        return successfully using the cached values.
        """
        # seed redis
        popular = [
            {
                "details": {
                    "name": "/pop1",
                    "icon": "",
                    "title": "Pop 1",
                    "publisher": "Pub 1",
                    "developer_validation": None,
                    "summary": "Popular snap",
                },
            }
        ]
        recent = [
            {
                "details": {
                    "name": "/recent1",
                    "icon": "",
                    "title": "Recent 1",
                    "publisher": "Pub 2",
                    "developer_validation": None,
                    "summary": "Recent snap",
                },
            }
        ]
        trending = [
            {
                "details": {
                    "name": "/trend1",
                    "icon": "",
                    "title": "Trend 1",
                    "publisher": "Pub 3",
                    "developer_validation": None,
                    "summary": "Trending snap",
                },
            }
        ]
        top_rated = [
            {
                "details": {
                    "name": "/top1",
                    "icon": "",
                    "title": "Top 1",
                    "publisher": "Pub 4",
                    "developer_validation": None,
                    "summary": "Top rated snap",
                },
            }
        ]
        categories = [{"slug": "cat1", "name": "Cat 1"}]

        redis_cache.set("explore:popular-snaps", popular, ttl=3600)
        redis_cache.set("explore:recent-snaps", recent, ttl=3600)
        redis_cache.set("explore:trending-snaps", trending, ttl=3600)
        redis_cache.set("explore:top-rated-snaps", top_rated, ttl=3600)
        redis_cache.set("explore:categories", categories, ttl=3600)

        with patch(POPULAR_PATH) as mock_popular:
            with patch(RECENT_PATH) as mock_recent:
                with patch(TREND_PATH) as mock_trending:
                    with patch(TOP_PATH) as mock_top_rated:
                        with patch(CATEGORIES_PATH) as mock_categories:
                            response = self.client.get("/explore")

                            self.assert200(response)

                            mock_popular.assert_not_called()
                            mock_recent.assert_not_called()
                            mock_trending.assert_not_called()
                            mock_top_rated.assert_not_called()
                            mock_categories.assert_not_called()

    @responses.activate
    def test_explore_populates_cache_when_empty(self):
        """When Redis cache is empty, the recommendation/device methods
        should be called and their results stored in Redis for subsequent
        requests.
        """

        with patch(
            POPULAR_PATH,
            return_value=[
                {
                    "details": {
                        "name": "/popx",
                        "icon": "",
                        "title": "Pop X",
                        "publisher": "Pub X",
                        "developer_validation": None,
                        "summary": "Popular x",
                    }
                }
            ],
        ) as mock_popular:
            with patch(
                RECENT_PATH,
                return_value=[
                    {
                        "details": {
                            "name": "/recentx",
                            "icon": "",
                            "title": "Recent X",
                            "publisher": "Pub RX",
                            "developer_validation": None,
                            "summary": "Recent x",
                        }
                    }
                ],
            ) as mock_recent:
                with patch(
                    TREND_PATH,
                    return_value=[
                        {
                            "details": {
                                "name": "/trendx",
                                "icon": "",
                                "title": "Trend X",
                                "publisher": "Pub TX",
                                "developer_validation": None,
                                "summary": "Trend x",
                            }
                        }
                    ],
                ) as mock_trending:
                    with patch(
                        TOP_PATH,
                        return_value=[
                            {
                                "details": {
                                    "name": "/topx",
                                    "icon": "",
                                    "title": "Top X",
                                    "publisher": "Pub TX",
                                    "developer_validation": None,
                                    "summary": "Top x",
                                }
                            }
                        ],
                    ) as mock_top_rated:
                        with patch(
                            CATEGORIES_PATH,
                            return_value=[{"slug": "c1", "name": "C1"}],
                        ) as mock_categories:
                            response = self.client.get("/explore")

                            self.assert200(response)

                            # ensure the methods were called to populate cache
                            self.assertTrue(mock_popular.called)
                            self.assertTrue(mock_recent.called)
                            self.assertTrue(mock_trending.called)
                            self.assertTrue(mock_top_rated.called)
                            self.assertTrue(mock_categories.called)
                            # cached values should now exist
                            pop_cached = redis_cache.get(
                                "explore:popular-snaps"
                            )
                            recent_cached = redis_cache.get(
                                "explore:recent-snaps"
                            )
                            trend_cached = redis_cache.get(
                                "explore:trending-snaps"
                            )
                            top_cached = redis_cache.get(
                                "explore:top-rated-snaps"
                            )
                            categories_cached = redis_cache.get(
                                "explore:categories"
                            )

                            assert pop_cached is not None
                            assert recent_cached is not None
                            assert trend_cached is not None
                            assert top_cached is not None
                            assert categories_cached is not None


if __name__ == "__main__":
    import unittest

    unittest.main()
