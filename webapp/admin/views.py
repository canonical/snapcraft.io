# Packages
import os
import json
import flask
from flask import make_response
from canonicalwebteam.store_api.exceptions import StoreApiResponseErrorList
from canonicalwebteam.store_api.stores.snapstore import SnapStoreAdmin
from flask.json import jsonify

# Local
from webapp.decorators import login_required
from webapp.helpers import api_publisher_session

admin_api = SnapStoreAdmin(api_publisher_session)

admin = flask.Blueprint(
    "admin", __name__, template_folder="/templates", static_folder="/static"
)

SNAPSTORE_DASHBOARD_API_URL = os.getenv(
    "SNAPSTORE_DASHBOARD_API_URL", "https://dashboard.snapcraft.io/"
)

context = {"api_url": SNAPSTORE_DASHBOARD_API_URL}


@admin.route("/admin", defaults={"path": ""})
@admin.route("/admin/<path:path>")
@login_required
def get_admin(path):
    return flask.render_template("admin/admin.html", **context)


@admin.route("/admin/stores")
@login_required
def get_stores():
    """
    In this view we get all the stores the user is an admin or we show a 403
    """
    stores = admin_api.get_stores(flask.session)

    return jsonify(stores)


@admin.route("/admin/store/<store_id>")
@login_required
def get_settings(store_id):
    store = admin_api.get_store(flask.session, store_id)

    return jsonify(store)


@admin.route("/admin/store/<store_id>/settings", methods=["POST"])
@login_required
def post_settings(store_id):
    settings = {}
    settings["private"] = json.loads(flask.request.form.get("private"))
    settings["manual-review-policy"] = flask.request.form.get(
        "manual-review-policy"
    )

    res = {}

    admin_api.change_store_settings(flask.session, store_id, settings)
    res["msg"] = "Changes saved"

    return jsonify({"success": True})


@admin.route("/admin/<store_id>/snaps/search")
@login_required
def get_snaps_search(store_id):
    snaps = admin_api.get_store_snaps(
        flask.session,
        store_id,
        flask.request.args.get("q"),
        flask.request.args.get("allowed_for_inclusion"),
    )

    return jsonify(snaps)


@admin.route("/admin/store/<store_id>/snaps")
@login_required
def get_store_snaps(store_id):
    snaps = admin_api.get_store_snaps(flask.session, store_id)
    store = admin_api.get_store(flask.session, store_id)
    if "store-whitelist" in store:
        included_stores = []
        for item in store["store-whitelist"]:
            try:
                store_item = admin_api.get_store(flask.session, item)
                if store_item:
                    included_stores.append(
                        {
                            "id": store_item["id"],
                            "name": store_item["name"],
                            "userHasAccess": True,
                        }
                    )
            except Exception:
                included_stores.append(
                    {
                        "id": item,
                        "name": "Private store",
                        "userHasAccess": False,
                    }
                )

        if included_stores:
            snaps.append({"included-stores": included_stores})
    return jsonify(snaps)


@admin.route("/admin/store/<store_id>/snaps", methods=["POST"])
@login_required
def post_manage_store_snaps(store_id):
    snaps = json.loads(flask.request.form.get("snaps"))

    res = {}

    admin_api.update_store_snaps(flask.session, store_id, snaps)
    res["msg"] = "Changes saved"

    return jsonify({"success": True})


@admin.route("/admin/store/<store_id>/members")
@login_required
def get_manage_members(store_id):
    members = admin_api.get_store_members(flask.session, store_id)

    for item in members:
        if item["email"] == flask.session["publisher"]["email"]:
            item["current_user"] = True

    return jsonify(members)


@admin.route("/admin/store/<store_id>/members", methods=["POST"])
@login_required
def post_manage_members(store_id):
    members = json.loads(flask.request.form.get("members"))

    res = {}

    try:
        admin_api.update_store_members(flask.session, store_id, members)
        res["msg"] = "Changes saved"
    except StoreApiResponseErrorList as api_response_error_list:
        codes = [error.get("code") for error in api_response_error_list.errors]

        msgs = [
            f"{error.get('message', 'An error occurred')}"
            for error in api_response_error_list.errors
        ]

        for code in codes:
            account_id = ""

            if code == "store-users-no-match":
                if account_id:
                    res["msg"] = code
                else:
                    res["msg"] = "invite"

            elif code == "store-users-multiple-matches":
                res["msg"] = code
            else:
                for msg in msgs:
                    flask.flash(msg, "negative")

    return jsonify(res)


@admin.route("/admin/store/<store_id>/invites")
@login_required
def get_invites(store_id):
    invites = admin_api.get_store_invites(flask.session, store_id)

    return jsonify(invites)


@admin.route("/admin/store/<store_id>/invite", methods=["POST"])
@login_required
def post_invite_members(store_id):
    members = json.loads(flask.request.form.get("members"))

    res = {}

    try:
        admin_api.invite_store_members(flask.session, store_id, members)
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


@admin.route("/admin/store/<store_id>/invite/update", methods=["POST"])
@login_required
def update_invite_status(store_id):
    invites = json.loads(flask.request.form.get("invites"))

    res = {}

    try:
        admin_api.update_store_invites(flask.session, store_id, invites)
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


# ---------------------- MODELS SERVICES ----------------------
@admin.route("/admin/store/<store_id>/models/<model_name>/policies")
@login_required
def get_policies(store_id: str, model_name: str):
    """
    Get the policies for a given store model.

    Args:
        store_id (str): The ID of the store.
        model_name (str): The name of the model.

    Returns:
        dict: A dictionary containing the response message and success
    """
    res = {}

    try:
        policies = admin_api.get_store_model_policies(
            flask.session, store_id, model_name
        )
        res["success"] = True
        res["data"] = policies
    except StoreApiResponseErrorList as error_list:
        res["success"] = False
        res["message"] = " ".join(
            [
                f"{error.get('message', 'An error occurred')}"
                for error in error_list.errors
            ]
        )
    except Exception:
        res["success"] = False
        res["message"] = "An error occurred"

    response = make_response(res)
    response.cache_control.max_age = "3600"
    return response


@admin.route(
    "/admin/store/<store_id>/models/<model_name>/policies", methods=["POST"]
)
@login_required
def create_policy(store_id: str, model_name: str):
    """
    Creat policy for a store model.

    Args:
        store_id (str): The ID of the store.
        model_name (str): The name of the model.

    Returns:
        dict: A dictionary containing the response message and success
    """
    signing_key = flask.request.form.get("signing_key")
    res = {}
    try:
        signing_keys_data = admin_api.get_store_signing_keys(
            flask.session, store_id
        )
        signing_keys = [key["sha3-384"] for key in signing_keys_data]

        if not signing_key:
            res["msg"] = "Signing key required"
            res["success"] = False
            return jsonify(res)

        if signing_key in signing_keys:
            admin_api.create_store_model_policy(
                flask.session, store_id, model_name, signing_key
            )
            res["msg"] = "Policy created"
            res["success"] = True
        else:
            res["msg"] = "Invalid signing key"
            res["success"] = False
    except StoreApiResponseErrorList as error_list:
        res["success"] = False
        res["msg"] = error_list.errors[0]["message"]

    return make_response(res)
