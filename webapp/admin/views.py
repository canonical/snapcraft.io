# Packages
import os
import json
import flask
from flask import make_response
from canonicalwebteam.exceptions import (
    StoreApiResponseErrorList,
    StoreApiResourceNotFound,
)
from canonicalwebteam.store_api.dashboard import Dashboard
from canonicalwebteam.store_api.publishergw import PublisherGW
from canonicalwebteam.store_api.devicegw import DeviceGW
from flask.json import jsonify

# Local
from webapp.decorators import login_required, exchange_required
from webapp.helpers import api_publisher_session, api_session
from webapp.endpoints.models import get_models, get_policies


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


@admin.route("/api/store/<store_id>/settings", methods=["PUT"])
@login_required
@exchange_required
def post_settings(store_id):
    settings = {}
    settings["private"] = json.loads(flask.request.form.get("private"))
    settings["manual-review-policy"] = flask.request.form.get(
        "manual-review-policy"
    )

    res = {}

    dashboard.change_store_settings(flask.session, store_id, settings)
    res["msg"] = "Changes saved"

    return jsonify({"success": True})


@admin.route("/api/<store_id>/snaps/search")
@login_required
@exchange_required
def get_snaps_search(store_id):
    snaps = dashboard.get_store_snaps(
        flask.session,
        store_id,
        flask.request.args.get("q"),
        flask.request.args.get("allowed_for_inclusion"),
    )

    return jsonify(snaps)


@admin.route("/api/store/<store_id>/snaps")
@login_required
@exchange_required
def get_store_snaps(store_id):
    snaps = dashboard.get_store_snaps(flask.session, store_id)
    store = dashboard.get_store(flask.session, store_id)
    if "store-whitelist" in store:
        included_stores = []
        for item in store["store-whitelist"]:
            try:
                store_item = dashboard.get_store(flask.session, item)
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


@admin.route("/api/store/<store_id>/snaps", methods=["POST"])
@login_required
@exchange_required
def post_manage_store_snaps(store_id):
    snaps = json.loads(flask.request.form.get("snaps"))

    res = {}

    dashboard.update_store_snaps(flask.session, store_id, snaps)
    res["msg"] = "Changes saved"

    return jsonify({"success": True})


@admin.route("/api/store/<store_id>/members")
@login_required
@exchange_required
def get_manage_members(store_id):
    members = dashboard.get_store_members(flask.session, store_id)

    for item in members:
        if item["email"] == flask.session["publisher"]["email"]:
            item["current_user"] = True

    return jsonify(members)


@admin.route("/api/store/<store_id>/members", methods=["POST"])
@login_required
@exchange_required
def post_manage_members(store_id):
    members = json.loads(flask.request.form.get("members"))

    res = {}

    try:
        dashboard.update_store_members(flask.session, store_id, members)
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


@admin.route("/api/store/<store_id>/invites")
@login_required
@exchange_required
def get_invites(store_id):
    invites = dashboard.get_store_invites(flask.session, store_id)

    return jsonify(invites)


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


# ---------------------- MODELS SERVICES ----------------------


@admin.route("/api/store/<store_id>/models", methods=["POST"])
@login_required
@exchange_required
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
            return make_response(res, 500)

        if api_key and len(api_key) != 50 and not api_key.isalpha():
            res["message"] = "Invalid API key"
            res["success"] = False
            return make_response(res, 500)

        publisher_gateway.create_store_model(
            flask.session, store_id, name, api_key
        )
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


@admin.route("/api/store/<store_id>/models/<model_name>", methods=["PATCH"])
@login_required
@exchange_required
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
            return make_response(res, 500)

        publisher_gateway.update_store_model(
            flask.session, store_id, model_name, api_key
        )
        res["success"] = True

    except StoreApiResponseErrorList as error_list:
        res["success"] = False
        res["message"] = error_list.errors[0]["message"]

    except StoreApiResourceNotFound:
        res["success"] = False
        res["message"] = "Model not found"
    if res["success"]:
        return make_response(res, 200)
    return make_response(res, 500)


@admin.route(
    "/api/store/<store_id>/models/<model_name>/policies", methods=["POST"]
)
@login_required
@exchange_required
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
        signing_keys_data = publisher_gateway.get_store_signing_keys(
            flask.session, store_id
        )
        signing_keys = [key["sha3-384"] for key in signing_keys_data]

        if not signing_key:
            res["message"] = "Signing key required"
            res["success"] = False
            return make_response(res, 500)

        if signing_key in signing_keys:
            publisher_gateway.create_store_model_policy(
                flask.session, store_id, model_name, signing_key
            )
            res["success"] = True
        else:
            res["message"] = "Invalid signing key"
            res["success"] = False
    except StoreApiResponseErrorList as error_list:
        res["success"] = False
        res["message"] = error_list.errors[0]["message"]

    if res["success"]:
        return make_response(res, 200)
    return make_response(res, 500)


@admin.route(
    "/api/store/<store_id>/models/<model_name>/policies/<revision>",
    methods=["DELETE"],
)
@login_required
@exchange_required
def delete_policy(store_id: str, model_name: str, revision: str):
    res = {}
    try:
        response = publisher_gateway.delete_store_model_policy(
            flask.session, store_id, model_name, revision
        )
        if response.status_code == 204:
            res = {"success": True}
        if response.status_code == 404:
            res = {"success": False, "message": "Policy not found"}
    except StoreApiResponseErrorList as error_list:
        res["success"] = False
        res["message"] = error_list.errors[0]["message"]
    if res["success"]:
        return make_response(res, 200)
    return make_response(res, 500)


@admin.route("/api/store/<store_id>/signing-keys", methods=["POST"])
@login_required
@exchange_required
def create_signing_key(store_id: str):
    name = flask.request.form.get("name")
    res = {}

    try:
        if name and len(name) <= 128:
            publisher_gateway.create_store_signing_key(
                flask.session, store_id, name
            )
            res["success"] = True
            return make_response(res, 200)
        else:
            res["message"] = "Invalid signing key. Limit 128 characters"
            res["success"] = False
            make_response(res, 500)
    except StoreApiResponseErrorList as error_list:
        res["success"] = False
        res["message"] = error_list.errors[0]["message"]

    return make_response(res, 500)


@admin.route(
    "/api/store/<store_id>/signing-keys/<signing_key_sha3_384>",
    methods=["DELETE"],
)
@login_required
@exchange_required
def delete_signing_key(store_id: str, signing_key_sha3_384: str):
    """
    Deletes a signing key from the store.

    Args:
        store_id (str): The ID of the store.
        signing_key_sha3_384 (str): The signing key to delete.

    Returns:
        Response: A response object with the following fields:
            - success (bool): True if the signing key was deleted successfully,
              False otherwise.
            - message (str): A message describing the result of the deletion.
            - data (dict): A dictionary containing models where the signing
              key is used.
    """
    res = {}

    try:
        response = publisher_gateway.delete_store_signing_key(
            flask.session, store_id, signing_key_sha3_384
        )

        if response.status_code == 204:
            res["success"] = True
            return make_response(res, 200)
        elif response.status_code == 404:
            res["success"] = False
            res["message"] = "Signing key not found"
            return make_response(res, 404)
    except StoreApiResponseErrorList as error_list:
        message = error_list.errors[0]["message"]
        if (
            error_list.status_code == 409
            and "used to sign at least one serial policy" in message
        ):
            matching_models = []
            models_response = get_models(store_id).json
            models = models_response.get("data", [])

            for model in models:
                policies_resp = get_policies(store_id, model["name"]).json
                policies = policies_resp.get("data", [])
                matching_policies = [
                    {"revision": policy["revision"]}
                    for policy in policies
                    if policy["signing-key-sha3-384"] == signing_key_sha3_384
                ]
                if matching_policies:
                    matching_models.append(
                        {
                            "name": model["name"],
                            "policies": matching_policies,
                        }
                    )
                res["data"] = {"models": matching_models}
                res["message"] = "Signing key is used in at least one policy"
                res["success"] = False
        else:
            res["success"] = False
            res["message"] = error_list.errors[0]["message"]

        return make_response(res, 500)


# ---------------------- END MODELS SERVICES ----------------------


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
