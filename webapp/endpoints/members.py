# Packages
import flask
from flask.json import jsonify
from canonicalwebteam.store_api.dashboard import Dashboard

# Local
from webapp.decorators import login_required, exchange_required
from webapp.helpers import api_session


dashboard = Dashboard(api_session)

members = flask.Blueprint(
    "members",
    __name__,
)


@members.route("/api/store/<store_id>/members")
@login_required
@exchange_required
def get_manage_members(store_id):
    members = dashboard.get_store_members(flask.session, store_id)

    for item in members:
        if item["email"] == flask.session["publisher"]["email"]:
            item["current_user"] = True

    return jsonify(members)
