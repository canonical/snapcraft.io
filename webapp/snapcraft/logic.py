from datetime import datetime, timedelta

from canonicalwebteam.store_api.devicegw import DeviceGW

from cache.cache_utility import redis_cache
from webapp import helpers

device_gateway = DeviceGW("snap", helpers.api_session)

FEATURED_SNAPS_PER_CATEGORY = 3


def get_livestreams():
    """
    Get available livestreams and decide whether they should be shown
    :returns: Dictionary of livestream details
    """
    livestream_to_show = None
    livestreams = helpers.get_yaml(
        "snapcraft/content/snapcraft_live.yaml", typ="safe"
    )

    if livestreams:
        now = datetime.now()
        lead_time = 4  # 4 days
        cooldown_time = 2  # 2 days

        for livestream in livestreams:
            instance_lead_time = lead_time
            if "lead_time" in livestream:
                instance_lead_time = livestream["lead_time"]

            instance_cooldown_time = cooldown_time
            if "cooldown_time" in livestream:
                instance_cooldown_time = livestream["cooldown_time"]

            show_from = livestream["time"] - timedelta(days=instance_lead_time)
            show_until = livestream["time"] + timedelta(
                days=instance_cooldown_time
            )

            if show_from < now and show_until > now:
                livestream_to_show = livestream

    return livestream_to_show


def get_featured_snaps(categories):
    """
    Get the first snaps of each category for the home page
    :param categories: List of category names
    :returns: Dictionary of category name (lowercase) to a list of snaps
    """
    featured_snaps = {}

    for category in categories:
        category = category.lower()
        cache_key = f"home:featured-snaps:{category}"
        snaps = redis_cache.get(cache_key, expected_type=list)

        if snaps is None:
            snaps = device_gateway.get_category_items(
                category=category,
                size=FEATURED_SNAPS_PER_CATEGORY,
                page=1,
            )["_embedded"]["clickindex:package"]

            for snap in snaps:
                snap["icon_url"] = helpers.get_icon(snap["media"])

            redis_cache.set(cache_key, snaps, ttl=3600)

        featured_snaps[category] = snaps

    return featured_snaps
