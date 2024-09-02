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
    screenshots = filter_screenshots(snap_details["media"])
    has_screenshot = True if screenshots else False
    snap_public_details = store_api.get_item_details(snap_name, api_version=2)

    context = {
        "snap_name": snap_details["snap_name"],
        "has_screenshot": has_screenshot,
        "trending": snap_public_details["snap"]["trending"],
    }

    return flask.render_template("store/publisher.html", **context)
