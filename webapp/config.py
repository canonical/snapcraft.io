import os
from canonicalwebteam.flask_base.env import load_plain_env_variables


class ConfigurationError(Exception):
    pass


# Load the prefixed FLASK_* env vars into env vars without the prefix. We have
# to do this explicitly here because otherwise the config module is imported
# by other files before the FlaskBase app gets initialized and does this by
# itself, meaning that the variables below are not set correctly
load_plain_env_variables()

SECRET_KEY = os.getenv("SECRET_KEY")
LOGIN_URL = os.getenv("LOGIN_URL", "https://login.ubuntu.com")
BSI_URL = os.getenv("BSI_URL", "https://build.snapcraft.io")
ENVIRONMENT = os.getenv("ENVIRONMENT", "devel")
IS_DEVELOPMENT = ENVIRONMENT == "devel"
COMMIT_ID = os.getenv("COMMIT_ID", "commit_id")
SENTRY_DSN = os.getenv("SENTRY_DSN", "").strip()
SENTRY_CONFIG = {"release": COMMIT_ID, "environment": ENVIRONMENT}
DNS_VERIFICATION_SALT = os.getenv("DNS_VERIFICATION_SALT")
VITE_PORT = os.getenv("VITE_PORT", 5173)
VITE_OUTPUT_DIR = os.getenv("VITE_OUTPUT_DIR", "static/js/dist/vite")

if ENVIRONMENT != "devel":
    SESSION_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = True

WEBAPP_CONFIG = {"LAYOUT": "_layout.html", "STORE_NAME": "Snap store"}

WEBAPP_EXTRA_HEADERS = {}

# Ten years default cache time on static files
SEND_FILE_MAX_AGE_DEFAULT = 10 * 365 * 24 * 60 * 60

CONTENT_DIRECTORY = {"PUBLISHER_PAGES": "store/content/publishers/"}

APP_NAME = "snapcraft"
