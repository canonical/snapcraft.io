import os


SECRET_KEY = os.getenv('SECRET_KEY')

LOGIN_URL = os.getenv(
    'LOGIN_URL',
    'https://login.ubuntu.com',
)

ENVIRONMENT = os.getenv(
    'ENVIRONMENT',
    'devel'
)
COMMIT_ID = os.getenv(
    'COMMIT_ID',
    'commit_id'
)

SENTRY_PUBLIC_DSN = os.getenv('SENTRY_PUBLIC_DSN', '').strip()
SENTRY_CONFIG = {
    'release': COMMIT_ID,
    'environment': ENVIRONMENT
}

WEBAPP = os.getenv('WEBAPP', 'snapcraft')
WEBAPP_EXTRA_HEADERS = {}
