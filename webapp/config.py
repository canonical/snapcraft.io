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

# Vite integration config values
VITE_MODE = "development" if IS_DEVELOPMENT else "production"
VITE_PORT = os.getenv("VITE_PORT", 5173)
VITE_OUTDIR = os.getenv("VITE_OUTDIR", "static/js/dist/vite")
# VITE_REACT controls whether React hot module reload scripts are injected when
# running in dev mode; the setting has no effect in prod mode
VITE_REACT = True

if ENVIRONMENT != "devel":
    SESSION_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = True

WEBAPP_CONFIG = {"LAYOUT": "_layout.html", "STORE_NAME": "Snap store"}

WEBAPP_EXTRA_HEADERS = {}

# Ten years default cache time on static files
SEND_FILE_MAX_AGE_DEFAULT = 10 * 365 * 24 * 60 * 60

CONTENT_DIRECTORY = {"PUBLISHER_PAGES": "store/content/publishers/"}

# Docs search
SEARCH_API_KEY = os.getenv("SEARCH_API_KEY")
SEARCH_API_URL = "https://www.googleapis.com/customsearch/v1"
SEARCH_CUSTOM_ID = "009048213575199080868:i3zoqdwqk8o"

# Ratings service configuration
# Set RATINGS_SERVICE_URL to enable ratings (e.g., "ratings.ubuntu.com")
RATINGS_SERVICE_URL = os.getenv("RATINGS_SERVICE_URL")

APP_NAME = "snapcraft"

REPORT_SHEET_URL = os.getenv("REPORT_SHEET_URL", "").strip()
