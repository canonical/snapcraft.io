import os

WEBAPP_CONFIG = {
    'LAYOUT': '_layout.html',
    'STORE_NAME': 'Snap store',
}

BLOG_ENABLED = os.getenv('BLOG_ENABLED', '').lower() == 'true'
