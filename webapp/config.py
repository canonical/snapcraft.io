import os


class ConfigurationError(Exception):
    pass


SECRET_KEY = os.getenv("SECRET_KEY")

LOGIN_URL = os.getenv("LOGIN_URL", "https://login.ubuntu.com")

BSI_URL = os.getenv("BSI_URL", "https://build.snapcraft.io")

ENVIRONMENT = os.getenv("ENVIRONMENT", "devel")
COMMIT_ID = os.getenv("COMMIT_ID", "commit_id")

SENTRY_PUBLIC_DSN = os.getenv("SENTRY_PUBLIC_DSN", "").strip()
SENTRY_CONFIG = {"release": COMMIT_ID, "environment": ENVIRONMENT}

BLOG_CATEGORIES_ENABLED = os.getenv("BLOG_CATEGORIES_ENABLED", "true")

WEBAPP = os.getenv("WEBAPP")
if not WEBAPP:
    raise ConfigurationError("`WEBAPP` is not configured")

WEBAPP_EXTRA_HEADERS = {}

# Ten years default cache time on static files
SEND_FILE_MAX_AGE_DEFAULT = 10 * 365 * 24 * 60 * 60

CONTENT_DIRECTORY = {"PUBLISHER_PAGES": "store/content/publishers/"}
