# Packages
import os
import json
import flask
from flask import make_response
from canonicalwebteam.store_api.exceptions import (
    StoreApiResponseErrorList,
    StoreApiResourceNotFound,
)
from canonicalwebteam.store_api.stores.snapstore import SnapStoreAdmin
from flask.json import jsonify
from webapp.decorators import login_required

# Local
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
@admin.route("/admin/store/<store_id>/models")
@login_required
def get_models(store_id):
    """
    Retrieves models associated with a given store ID.

    Args:
        store_id (int): The ID of the store for which to retrieve models.

    Returns:
        dict: A dictionary containing the response message, success status,
        and data.
    """
    res = {}
    try:
        models = admin_api.get_store_models(flask.session, store_id)
        res["success"] = True
        res["data"] = models
        response = make_response(res, 200)
        response.cache_control.max_age = "3600"
        return response
    except StoreApiResponseErrorList as error_list:
        error_messages = [
            f"{error.get('message', 'An error occurred')}"
            for error in error_list.errors
        ]
        if "unauthorized" in error_messages:
            res["message"] = "Store not found"
        else:
            res["message"] = " ".join(error_messages)
        res["success"] = False

    response = make_response(res, 500)


@admin.route("/admin/store/<store_id>/models", methods=["POST"])
@login_required
def create_models(store_id: str):
    """
    Create a model for a given store.

    Args:
        store_id (str): The ID of the store.

    Returns:
        dict: A dictionary containing the response message and success
        status.
    """

    # TO DO: Addn validation that name does not exist already

    res = {}

    try:
        name = flask.request.form.get("name")
        api_key = flask.request.form.get("api_key", "")

        if len(name) > 128:
            res["message"] = "Name is too long. Limit 128 characters"
            res["success"] = False
            return jsonify(res)

        if api_key and len(api_key) != 50 and not api_key.isalpha():
            res["message"] = "Invalid API key"
            res["success"] = False
            return jsonify(res)

        admin_api.create_store_model(flask.session, store_id, name, api_key)
        res["success"] = True

        return make_response(res, 201)
    except StoreApiResponseErrorList as error_list:
        res["success"] = False
        messages = [
            f"{error.get('message', 'An error occurred')}"
            for error in error_list.errors
        ]
        res["message"] = (" ").join(messages)

    except Exception:
        res["success"] = False
        res["message"] = "An error occurred"

    return make_response(res, 500)


@admin.route("/admin/store/<store_id>/models/<model_name>", methods=["PATCH"])
@login_required
def update_model(store_id: str, model_name: str):
    """
    Update a model for a given store.

    Args:
        store_id (str): The ID of the store.
        model_name (str): The name of the model.

    Returns:
        dict: A dictionary containing the response message and success
            status.
    """
    res = {}

    try:
        api_key = flask.request.form.get("api_key", "")

        if len(api_key) != 50 and not api_key.isalpha():
            res["message"] = "Invalid API key"
            res["success"] = False
            return jsonify(res)

        admin_api.update_store_model(
            flask.session, store_id, model_name, api_key
        )
        res["success"] = True

    except StoreApiResponseErrorList as error_list:
        res["success"] = False
        res["message"] = error_list.errors[0]["message"]

    except StoreApiResourceNotFound:
        res["success"] = False
        res["message"] = "Model not found"

    return make_response(res, 200)
