# Packages
import flask
from canonicalwebteam.store_api.dashboard import Dashboard
from flask.json import jsonify

# Local
from webapp.decorators import login_required, exchange_required
from webapp.helpers import api_session


dashboard = Dashboard(api_session)

invites = flask.Blueprint(
    "invites",
    __name__,
)


@invites.route("/api/store/<store_id>/invites")
@login_required
@exchange_required
def get_invites(store_id):
    invites = dashboard.get_store_invites(flask.session, store_id)

    return jsonify(invites)
