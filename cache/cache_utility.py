from canonicalwebteam.stores_web_redis.utility import RedisCache
from webapp.config import APP_NAME


class MockCache(RedisCache):
    # extend the redis cache by replacing all public methods with mocks
    def get(self, key, expected_type=str):
        return None

    def set(self, key, value, ttl=300):
        pass

    def delete(self, key):
        pass


redis_cache = MockCache(
    namespace=APP_NAME,
    maxsize=1000,
    ttl=300,
)
