# Packages
import bleach
import flask
from canonicalwebteam.store_api.dashboard import Dashboard
from canonicalwebteam.exceptions import StoreApiResponseErrorList
from flask.json import jsonify

# Local
from webapp.helpers import api_publisher_session
from webapp.decorators import login_required

dashboard = Dashboard(api_publisher_session)


@login_required
def post_register_name():
    snap_name = flask.request.form.get("snap_name")
    res = {}

    if not snap_name:
        res["success"] = False
        res["message"] = "You must define a snap name"

        return jsonify(res)

    is_private = flask.request.form.get("is_private") == "private"
    store = flask.request.form.get("store")

    try:
        dashboard.post_register_name(
            session=flask.session,
            snap_name=snap_name,
            registrant_comment=None,
            is_private=is_private,
            store=store,
        )
    except StoreApiResponseErrorList as api_response_error_list:
        res = {
            "success": False,
            "data": {
                "is_private": is_private,
                "snap_name": snap_name,
                "store": store,
            },
        }

        if api_response_error_list.status_code == 409:
            for error in api_response_error_list.errors:
                res["data"]["error_code"] = error["code"]

                return jsonify(res)

        if api_response_error_list.status_code == 400:
            res["data"]["error_code"] = "no-permission"
            res["message"] = """You don't have permission
                to register a snap in this store.
                Please see store administrator."""

            return jsonify(res)

        res["message"] = "Unable to register snap name"
        res["data"] = {
            "snap_name": snap_name,
            "is_private": is_private,
            "store": store,
        }

        return jsonify(res)

    return jsonify({"success": True})


@login_required
def post_register_name_dispute():
    try:
        claim = flask.json.loads(flask.request.data)
        snap_name = claim["snap-name"]
        claim_comment = claim["claim-comment"]
        dashboard.post_register_name_dispute(
            flask.session,
            bleach.clean(snap_name),
            bleach.clean(claim_comment),
        )
    except StoreApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code in [400, 409]:
            return jsonify(
                {
                    "success": False,
                    "data": api_response_error_list.errors,
                    "message": api_response_error_list.errors[0]["message"],
                }
            )
    return jsonify({"success": True})
