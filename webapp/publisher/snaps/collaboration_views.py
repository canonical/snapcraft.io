# Packages
import flask
from flask import json
from canonicalwebteam.store_api.stores.snapstore import (
    SnapPublisher,
    SnapStore,
)

# Local
from webapp.helpers import api_publisher_session
from webapp.decorators import login_required

store_api = SnapStore(api_publisher_session)
publisher_api = SnapPublisher(api_publisher_session)


@login_required
def get_collaboration_snap(snap_name):
    snap_details = publisher_api.get_snap_info(snap_name, flask.session)

    context = {
        "snap_id": snap_details["snap_id"],
        "snap_name": snap_details["snap_name"],
        "snap_title": snap_details["title"],
        "publisher_name": snap_details["publisher"]["display-name"],
        "collaborators": [],
        "invites": [],
    }

    return flask.render_template(
        "publisher/collaboration.html",
        **context,
        collaborations_data=json.dumps(context)
    )
