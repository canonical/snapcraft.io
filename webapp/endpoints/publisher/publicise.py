# Packages
import flask
from canonicalwebteam.store_api.dashboard import Dashboard
from canonicalwebteam.store_api.devicegw import DeviceGW
from canonicalwebteam.exceptions import StoreApiError

# Local
from webapp.helpers import api_session
from webapp.decorators import login_required
from cache.cache_utility import redis_cache
from webapp.endpoints.utils import (
    get_item_details_cache_key,
    get_cached_snap_info,
    set_cached_snap_info,
)

dashboard = Dashboard(api_session)
device_gateway = DeviceGW("snap", api_session)


@login_required
def get_publicise_data(snap_name):
    snap_details = get_cached_snap_info(snap_name)
    if not snap_details:
        snap_details = dashboard.get_snap_info(flask.session, snap_name)
        set_cached_snap_info(snap_name, snap_details)

    try:
        get_item_details_key = get_item_details_cache_key(snap_name)
        cached_snap_details = redis_cache.get(
            get_item_details_key, expected_type=dict
        )
        if cached_snap_details:
            snap_public_details = cached_snap_details
        else:
            snap_public_details = device_gateway.get_item_details(
                snap_name, api_version=2, fields=["trending", "private"]
            )
            redis_cache.set(get_item_details_key, snap_public_details, ttl=300)
        trending = snap_public_details["snap"]["trending"]
    except StoreApiError:
        trending = False

    is_released = len(snap_details["channel_maps_list"]) > 0

    context = {
        "is_released": is_released,
        "trending": trending,
        "private": snap_details["private"],
    }

    return flask.jsonify({"success": True, "data": context})
