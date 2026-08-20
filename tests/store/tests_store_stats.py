import json
from unittest.mock import patch

from cache.cache_utility import redis_cache
from flask_testing import TestCase
from webapp.api.exceptions import ApiConnectionError, ApiTimeoutError
from webapp.app import create_app

STATS_PATH = "webapp.store.views.snap_recommendations.get_stats"
STATS_CACHE_KEY = "store:stats"

MOCK_STATS = {
    "total_tracked": 1234,
    "updated_today": 56,
    "new_today": 7,
}


class StoreStatsTest(TestCase):
    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []
        return app

    def setUp(self):
        redis_cache.delete(STATS_CACHE_KEY)

    def test_stats_returns_200_with_data_from_api(self):
        with patch(STATS_PATH, return_value=MOCK_STATS):
            response = self.client.get("/store/stats")

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["total_tracked"], 1234)
        self.assertEqual(data["updated_today"], 56)
        self.assertEqual(data["new_today"], 7)

    def test_stats_uses_redis_cache(self):
        redis_cache.set(STATS_CACHE_KEY, MOCK_STATS, ttl=3600)

        with patch(STATS_PATH) as mock_get_stats:
            response = self.client.get("/store/stats")
            mock_get_stats.assert_not_called()

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["total_tracked"], 1234)

    def test_stats_returns_503_on_connection_error(self):
        with patch(
            STATS_PATH, side_effect=ApiConnectionError("connection error")
        ):
            response = self.client.get("/store/stats")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(json.loads(response.data), {})

    def test_stats_returns_503_on_timeout_error(self):
        with patch(STATS_PATH, side_effect=ApiTimeoutError("timeout")):
            response = self.client.get("/store/stats")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(json.loads(response.data), {})
