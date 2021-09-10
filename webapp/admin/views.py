# Packages
import json
import flask
from canonicalwebteam.store_api.exceptions import (
    StoreApiError,
    StoreApiResponseErrorList,
)
from canonicalwebteam.store_api.stores.snapstore import SnapStoreAdmin
from flask.json import jsonify
from webapp.api.exceptions import ApiError
from webapp.decorators import login_required

# Local
from webapp.helpers import api_publisher_session
from webapp.publisher.views import _handle_error, _handle_error_list

admin_api = SnapStoreAdmin(api_publisher_session)

admin = flask.Blueprint(
    "admin", __name__, template_folder="/templates", static_folder="/static"
)


@admin.route("/admin", defaults={"path": ""})
@admin.route("/admin/<path:path>")
@login_required
def get_admin(path):
    return flask.render_template("admin/admin.html")


@admin.route("/admin/stores")
@login_required
def get_stores():
    """
    In this view we get all the stores the user is an admin or we show a 403
    """
    try:
        stores = admin_api.get_stores(flask.session)
    except StoreApiResponseErrorList as api_response_error_list:
        return _handle_error_list(api_response_error_list.errors)
    except (StoreApiError, ApiError) as api_error:
        return _handle_error(api_error)

    return jsonify(stores)


@admin.route("/admin/store/<store_id>")
@login_required
def get_settings(store_id):
    try:
        store = admin_api.get_store(flask.session, store_id)
    except StoreApiResponseErrorList as api_response_error_list:
        return _handle_error_list(api_response_error_list.errors)
    except (StoreApiError, ApiError) as api_error:
        return _handle_error(api_error)

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

    try:
        admin_api.change_store_settings(flask.session, store_id, settings)
        res["msg"] = "Changes saved"
    except StoreApiResponseErrorList as api_response_error_list:
        return jsonify({"error": True})
    except (StoreApiError, ApiError) as api_error:
        return _handle_error(api_error)

    return jsonify({"success": True})


@admin.route("/admin/<store_id>/snaps/search.json")
@login_required
def get_snaps_search(store_id):
    try:
        snaps = admin_api.get_store_snaps(
            flask.session,
            store_id,
            flask.request.args.get("q"),
            flask.request.args.get("allowed_for_inclusion"),
        )
    except StoreApiResponseErrorList as api_response_error_list:
        return _handle_error_list(api_response_error_list.errors)
    except (StoreApiError, ApiError) as api_error:
        return _handle_error(api_error)

    return jsonify(snaps)
