from flask_wtf.csrf import CSRFProtect
from raven.contrib.flask import Sentry


csrf = CSRFProtect()
sentry = Sentry()
