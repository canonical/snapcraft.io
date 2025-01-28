# Packages
import flask
from canonicalwebteam.store_api.stores.snapstore import (
    SnapStore,
    SnapPublisher,
)
from canonicalwebteam.store_api.exceptions import StoreApiError

# Local
from webapp.helpers import api_publisher_session
from webapp.decorators import login_required

store_api = SnapStore(api_publisher_session)
publisher_api = SnapPublisher(api_publisher_session)


@login_required
def get_publicise_data(snap_name):

    snap_details = publisher_api.get_snap_info(snap_name, flask.session)

    try:
        snap_public_details = store_api.get_item_details(
            snap_name, api_version=2
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
    publisher_api.get_snap_info(snap_name, flask.session)
    return flask.render_template("store/publisher.html", snap_name=snap_name)
