from flask_testing import TestCase as FlaskTestCase
from unittest import TestCase as UnitTestCase
from cache.cache_utility import redis_cache


class BaseFlaskTestCase(FlaskTestCase):
    """Base test class that clears cache before each test."""

    def setUp(self):
        super().setUp()
        # Clear cache before each test
        if redis_cache.redis_available:
            try:
                redis_cache.client.flushdb()
            except Exception:
                pass
        else:
            redis_cache.fallback.clear()


class BaseUnitTestCase(UnitTestCase):
    """Base unit test class that clears cache before each test."""

    def setUp(self):
        super().setUp()
        # Clear cache before each test
        if redis_cache.redis_available:
            try:
                redis_cache.client.flushdb()
            except Exception:
                pass
        else:
            redis_cache.fallback.clear()
