from flask_wtf.csrf import CSRFProtect
from raven.contrib.flask import Sentry
from flask_caching import Cache


csrf = CSRFProtect()
sentry = Sentry()
cache = Cache(config={'CACHE_TYPE': 'filesystem', 'CACHE_DIR': 'cache.tmp'})
