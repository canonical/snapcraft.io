# Packages
import flask
from flask import json
from canonicalwebteam.store_api.dashboard import Dashboard

# Local
from webapp.helpers import api_publisher_session
from webapp.decorators import login_required

dashboard = Dashboard(api_publisher_session)


@login_required
def get_collaboration_snap(snap_name):
    snap_details = dashboard.get_snap_info(flask.session, snap_name)

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
