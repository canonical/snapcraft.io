# Packages
import json
import flask
from canonicalwebteam.exceptions import (
    StoreApiResponseErrorList,
)
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


@invites.route("/api/store/<store_id>/invite/update", methods=["POST"])
@login_required
@exchange_required
def update_invite_status(store_id):
    invites = json.loads(flask.request.form.get("invites"))

    res = {}

    try:
        dashboard.update_store_invites(flask.session, store_id, invites)
        res["msg"] = "Changes saved"
    except StoreApiResponseErrorList as api_response_error_list:
        msgs = [
            f"{error.get('message', 'An error occurred')}"
            for error in api_response_error_list.errors
        ]

        msgs = list(dict.fromkeys(msgs))

        for msg in msgs:
            flask.flash(msg, "negative")

    return jsonify(res)


@invites.route("/api/store/<store_id>/invite", methods=["POST"])
@login_required
@exchange_required
def post_invite_members(store_id):
    members = json.loads(flask.request.form.get("members"))

    res = {}

    try:
        dashboard.invite_store_members(flask.session, store_id, members)
        res["msg"] = "Changes saved"
    except StoreApiResponseErrorList as api_response_error_list:
        msgs = [
            f"{error.get('message', 'An error occurred')}"
            for error in api_response_error_list.errors
        ]

        msgs = list(dict.fromkeys(msgs))

        for msg in msgs:
            flask.flash(msg, "negative")

    return jsonify(res)
