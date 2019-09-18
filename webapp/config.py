import os


class ConfigurationError(Exception):
    pass


SECRET_KEY = os.getenv("SECRET_KEY")
LOGIN_URL = os.getenv("LOGIN_URL", "https://login.ubuntu.com")
BSI_URL = os.getenv("BSI_URL", "https://build.snapcraft.io")
ENVIRONMENT = os.getenv("ENVIRONMENT", "devel")
COMMIT_ID = os.getenv("COMMIT_ID", "commit_id")
SENTRY_DSN = os.getenv("SENTRY_DSN", "").strip()
SENTRY_CONFIG = {"release": COMMIT_ID, "environment": ENVIRONMENT}

WEBAPP = os.getenv("WEBAPP", "snapcraft")

if not WEBAPP:
    raise ConfigurationError("`WEBAPP` is not configured")

WEBAPP_EXTRA_HEADERS = {}

# Ten years default cache time on static files
SEND_FILE_MAX_AGE_DEFAULT = 10 * 365 * 24 * 60 * 60

CONTENT_DIRECTORY = {"PUBLISHER_PAGES": "store/content/publishers/"}

# Docs search
SEARCH_API_KEY = os.getenv("SEARCH_API_KEY")
SEARCH_API_URL = "https://www.googleapis.com/customsearch/v1"
SEARCH_CUSTOM_ID = "009048213575199080868:i3zoqdwqk8o"
