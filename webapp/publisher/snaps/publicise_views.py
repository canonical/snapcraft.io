# Packages
import flask
from canonicalwebteam.store_api.dashboard import Dashboard

# Local
from webapp.helpers import api_session
from webapp.decorators import login_required

dashboard = Dashboard(api_session)


@login_required
def get_publicise(snap_name):
    # If this fails, the page will 404
    dashboard.get_snap_info(flask.session, snap_name)
    return flask.render_template("store/publisher.html", snap_name=snap_name)
