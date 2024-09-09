# Packages
import flask
from canonicalwebteam.store_api.stores.snapstore import (
    SnapStore,
    SnapPublisher,
)

# Local
from webapp.helpers import api_publisher_session
from webapp.decorators import login_required
from webapp.store.logic import filter_screenshots

store_api = SnapStore(api_publisher_session)
publisher_api = SnapPublisher(api_publisher_session)


@login_required
def get_publicise(snap_name):
    snap_details = publisher_api.get_snap_info(snap_name, flask.session)

    is_released = len(snap_details["channel_maps_list"]) > 0

    context = {
        "private": snap_details["private"],
        "snap_name": snap_details["snap_name"],
        "is_released": is_released,
    }

    return flask.render_template("store/publisher.html", **context)


@login_required
def get_publicise_badges(snap_name):
    snap_details = publisher_api.get_snap_info(snap_name, flask.session)

    if snap_details["private"]:
        return flask.abort(404, "No snap named {}".format(snap_name))

    snap_public_details = store_api.get_item_details(snap_name, api_version=2)

    context = {
        "snap_name": snap_details["snap_name"],
        "trending": snap_public_details["snap"]["trending"],
    }

    return flask.render_template("store/publisher.html", **context)


@login_required
def get_publicise_cards(snap_name):
    snap_details = publisher_api.get_snap_info(snap_name, flask.session)

    if snap_details["private"]:
        return flask.abort(404, "No snap named {}".format(snap_name))

    screenshots = filter_screenshots(snap_details["media"])
    has_screenshot = True if screenshots else False

    context = {
        "has_screenshot": has_screenshot,
        "snap_name": snap_details["snap_name"],
    }

    return flask.render_template("store/publisher.html", **context)
