import unittest
from unittest.mock import MagicMock, patch

import redis
from flask import Flask

# Pre-import so flask_session's own `from redis import Redis` binding
# resolves to the real class before any test below patches `redis.Redis`.
import flask_session.redis.redis  # noqa: F401

from webapp.app import _configure_server_side_sessions

# Captured before any @patch below replaces redis.Redis for a test.
_REAL_REDIS_CLASS = redis.Redis


class ConfigureServerSideSessionsTest(unittest.TestCase):
    def _make_app(self):
        app = Flask(__name__)
        app.config["SESSION_TYPE"] = "redis"
        app.config["REDIS_DB_HOSTNAME"] = "localhost"
        app.config["REDIS_DB_PORT"] = 6379
        app.config["REDIS_DB_PASSWORD"] = None
        return app

    @patch("webapp.app.sentry_sdk.capture_exception")
    @patch("webapp.app.redis.Redis")
    def test_falls_back_to_local_sessions_when_redis_unreachable(
        self, mock_redis_cls, mock_capture_exception
    ):
        mock_client = MagicMock()
        mock_client.ping.side_effect = redis.RedisError("connection refused")
        mock_redis_cls.return_value = mock_client

        app = self._make_app()
        _configure_server_side_sessions(app)

        self.assertEqual(app.config["SESSION_TYPE"], "cachelib")
        self.assertIn("SESSION_CACHELIB", app.config)
        mock_capture_exception.assert_called_once()

    @patch("webapp.app.redis.Redis")
    def test_keeps_redis_session_when_reachable(self, mock_redis_cls):
        # flask_session asserts isinstance(client, Redis); faking __class__
        # with the pre-patch class satisfies that.
        mock_client = MagicMock()
        mock_client.__class__ = _REAL_REDIS_CLASS
        mock_redis_cls.return_value = mock_client

        app = self._make_app()
        _configure_server_side_sessions(app)

        self.assertEqual(app.config["SESSION_TYPE"], "redis")
        self.assertIs(app.config["SESSION_REDIS"], mock_client)


if __name__ == "__main__":
    unittest.main()
