# Packages
import os
import json
import flask
from flask import make_response
from canonicalwebteam.exceptions import (
    StoreApiResponseErrorList,
)
from canonicalwebteam.store_api.dashboard import Dashboard
from canonicalwebteam.store_api.publishergw import PublisherGW
from canonicalwebteam.store_api.devicegw import DeviceGW
from flask.json import jsonify

# Local
from webapp.decorators import login_required, exchange_required
from webapp.helpers import api_publisher_session, api_session


dashboard = Dashboard(api_session)
publisher_gateway = PublisherGW("snap", api_publisher_session)
device_gateway = DeviceGW("snap", api_session)

admin = flask.Blueprint(
    "admin", __name__, template_folder="/templates", static_folder="/static"
)

SNAPSTORE_DASHBOARD_API_URL = os.getenv(
    "SNAPSTORE_DASHBOARD_API_URL", "https://dashboard.snapcraft.io/"
)

context = {"api_url": SNAPSTORE_DASHBOARD_API_URL}


def get_brand_id(session, store_id):
    store = dashboard.get_store(session, store_id)
    return store["brand-id"]


@admin.route("/admin", defaults={"path": ""})
@admin.route("/admin/<path:path>")
@login_required
@exchange_required
def get_admin(path):
    return flask.render_template("admin/admin.html", **context)


@admin.route("/api/store/<store_id>/invite", methods=["POST"])
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


@admin.route("/api/store/<store_id>/invite/update", methods=["POST"])
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


# -------------------- FEATURED SNAPS AUTOMATION ------------------
@admin.route("/admin/featured", methods=["POST"])
@login_required
@exchange_required
def post_featured_snaps():
    """
    In this view, we do three things:
    1. Fetch all currently featured snaps
    2. Delete the currently featured snaps
    3. Update featured snaps to be newly featured

    Args:
        None

    Returns:
        dict: A dictionary containing the response message and success status.
    """

    # new_featured_snaps is the list of featured snaps to be updated
    featured_snaps = flask.request.form.get("snaps")

    if not featured_snaps:
        response = {
            "success": False,
            "message": "Snaps cannot be empty",
        }
        return make_response(response, 500)
    new_featured_snaps = featured_snaps.split(",")

    # currently_featured_snap is the list of featured snaps to be deleted
    currently_featured_snaps = []

    next = True
    while next:
        featured_snaps = device_gateway.get_featured_snaps()
        currently_featured_snaps.extend(
            featured_snaps.get("_embedded", {}).get("clickindex:package", [])
        )
        next = featured_snaps.get("_links", {}).get("next", False)

    currently_featured_snap_ids = [
        snap["snap_id"] for snap in currently_featured_snaps
    ]

    delete_response = publisher_gateway.delete_featured_snaps(
        flask.session, {"packages": currently_featured_snap_ids}
    )
    if delete_response.status_code != 201:
        response = {
            "success": False,
            "message": "An error occurred while deleting featured snaps",
        }
        return make_response(response, 500)
    snap_ids = [
        dashboard.get_snap_id(flask.session, snap_name)
        for snap_name in new_featured_snaps
    ]

    update_response = publisher_gateway.update_featured_snaps(
        flask.session, snap_ids
    )
    if update_response.status_code != 201:
        response = {
            "success": False,
            "message": "An error occured while updating featured snaps",
        }
        return make_response(response, 500)
    return make_response({"success": True}, 200)
