import os

WEBAPP_CONFIG = {"LAYOUT": "_layout.html", "STORE_NAME": "Snap store"}

BLOG_CATEGORIES_ENABLED = os.getenv("BLOG_CATEGORIES_ENABLED", "false")
