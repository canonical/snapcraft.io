import os

WEBAPP_CONFIG = {"LAYOUT": "_layout.html", "STORE_NAME": "Snap store"}

FEATURED_BANNERS_ENABLED = os.getenv(
    "FEATURED_BANNERS_ENABLED", "false"
).lower() in ["1", "t", "true"]
