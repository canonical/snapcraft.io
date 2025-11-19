from canonicalwebteam.stores_web_redis.utility import RedisCache
from webapp.config import APP_NAME

redis_cache = RedisCache(
    namespace=APP_NAME,
    maxsize=1000,
    ttl=300,
)
