# Packages
import flask
from canonicalwebteam.store_api.dashboard import Dashboard
from canonicalwebteam.store_api.devicegw import DeviceGW
from canonicalwebteam.exceptions import StoreApiError

# Local
from webapp.helpers import api_session
from webapp.decorators import login_required

dashboard = Dashboard(api_session)
device_gateway = DeviceGW("snap", api_session)


@login_required
def get_publicise_data(snap_name):
    snap_details = dashboard.get_snap_info(flask.session, snap_name)

    try:
        snap_public_details = device_gateway.get_item_details(
            snap_name, api_version=2, fields=["trending", "private"]
        )
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


@login_required
def get_publicise(snap_name):
    # If this fails, the page will 404
    dashboard.get_snap_info(flask.session, snap_name)
    return flask.render_template("store/publisher.html", snap_name=snap_name)
