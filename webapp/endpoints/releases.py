# Packages
import flask
from canonicalwebteam.store_api.dashboard import Dashboard

# Local
from webapp.helpers import api_publisher_session
from webapp.decorators import login_required

dashboard = Dashboard(api_publisher_session)


@login_required
def get_release_history_data(snap_name):
    release_history = dashboard.snap_release_history(flask.session, snap_name)

    channel_map = dashboard.snap_channel_map(flask.session, snap_name)

    snap = channel_map.get("snap", {})

    context = {
        "snap_name": snap_name,
        "snap_title": snap.get("title"),
        "publisher_name": snap.get("publisher", {}).get("display-name", {}),
        "release_history": release_history,
        "private": snap.get("private"),
        "default_track": (
            snap.get("default-track")
            if snap.get("default-track") is not None
            else "latest"
        ),
        "channel_map": channel_map.get("channel-map"),
        "tracks": snap.get("tracks"),
    }

    return flask.jsonify({"success": True, "data": context})
