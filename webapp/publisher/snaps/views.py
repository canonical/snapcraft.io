# Packages
import bleach
import flask
import re
from canonicalwebteam.store_api.stores.snapstore import (
    SnapPublisher,
    SnapStoreAdmin,
)
from canonicalwebteam.store_api.exceptions import (
    StoreApiError,
    StoreApiResponseErrorList,
)
from flask.json import jsonify

# Local
from webapp import authentication
from webapp.helpers import api_publisher_session, launchpad
from webapp.api.exceptions import ApiError
from webapp.decorators import exchange_required, login_required
from webapp.publisher.snaps import (
    build_views,
    listing_views,
    logic,
    metrics_views,
    publicise_views,
    release_views,
    settings_views,
    collaboration_views,
)
from webapp.publisher.snaps.builds import map_snap_build_status

publisher_api = SnapPublisher(api_publisher_session)
admin_api = SnapStoreAdmin(api_publisher_session)


publisher_snaps = flask.Blueprint(
    "publisher_snaps",
    __name__,
    template_folder="/templates",
    static_folder="/static",
)

# Listing views
publisher_snaps.add_url_rule(
    "/account/snaps/<snap_name>/market",
    view_func=listing_views.get_market_snap,
)
publisher_snaps.add_url_rule(
    "/account/snaps/<snap_name>/listing",
    view_func=listing_views.get_market_snap,
    methods=["GET"],
)
publisher_snaps.add_url_rule(
    "/account/snaps/<snap_name>/listing",
    view_func=listing_views.redirect_post_market_snap,
    methods=["POST"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/listing",
    view_func=listing_views.get_listing_snap,
    methods=["GET"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/listing.json",
    view_func=listing_views.get_listing_snap,
    methods=["GET"],
    defaults={"is_json": True},
)
publisher_snaps.add_url_rule(
    "/<snap_name>/listing",
    view_func=listing_views.post_listing_snap,
    methods=["POST"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/listing.json",
    view_func=listing_views.post_listing_snap,
    methods=["POST"],
    defaults={"is_json": True},
)
publisher_snaps.add_url_rule(
    "/<snap_name>/preview",
    view_func=listing_views.post_preview,
    methods=["POST"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/collaboration",
    view_func=collaboration_views.get_collaboration_snap,
    methods=["GET"],
)

# Build views
publisher_snaps.add_url_rule(
    "/<snap_name>/builds",
    view_func=build_views.get_snap_builds,
    methods=["GET"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/builds.json",
    view_func=build_views.get_snap_builds_json,
    methods=["GET"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/builds",
    view_func=build_views.post_snap_builds,
    methods=["POST"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/builds/<build_id>",
    view_func=build_views.get_snap_build,
    methods=["GET"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/builds/validate-repo",
    view_func=build_views.get_validate_repo,
    methods=["GET"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/builds/trigger-build",
    view_func=build_views.post_build,
    methods=["POST"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/builds/check-build-request/<build_id>",
    view_func=build_views.check_build_request,
    methods=["GET"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/webhook/notify",
    view_func=build_views.post_github_webhook,
    methods=["POST"],
)
# This route is to support previous webhooks from build.snapcraft.io
publisher_snaps.add_url_rule(
    "/<github_owner>/<github_repo>/webhook/notify",
    view_func=build_views.post_github_webhook,
    methods=["POST"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/builds/update-webhook",
    view_func=build_views.get_update_gh_webhooks,
    methods=["GET"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/builds/disconnect/",
    view_func=build_views.post_disconnect_repo,
    methods=["POST"],
)

# Release views
publisher_snaps.add_url_rule(
    "/account/snaps/<snap_name>/release",
    view_func=release_views.redirect_get_release_history,
)
publisher_snaps.add_url_rule(
    "/<snap_name>/release",
    view_func=release_views.redirect_get_release_history,
)
publisher_snaps.add_url_rule(
    "/<snap_name>/releases",
    view_func=release_views.get_release_history,
    methods=["GET"],
)
publisher_snaps.add_url_rule(
    "/account/snaps/<snap_name>/release",
    view_func=release_views.redirect_post_release,
    methods=["POST"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/release",
    view_func=release_views.redirect_post_release,
    methods=["POST"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/releases/json",
    view_func=release_views.get_release_history_json,
)
publisher_snaps.add_url_rule(
    "/<snap_name>/releases",
    view_func=release_views.post_release,
    methods=["POST"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/release/close-channel",
    view_func=release_views.redirect_post_close_channel,
    methods=["POST"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/releases/close-channel",
    view_func=release_views.post_close_channel,
    methods=["POST"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/releases/default-track",
    view_func=release_views.post_default_track,
    methods=["POST"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/releases/revision/<revision>",
    view_func=release_views.get_snap_revision_json,
)

# Metrics views
publisher_snaps.add_url_rule(
    "/snaps/metrics/json",
    view_func=metrics_views.get_account_snaps_metrics,
    methods=["POST"],
)
publisher_snaps.add_url_rule(
    "/account/snaps/<snap_name>/measure",
    view_func=metrics_views.get_measure_snap,
)
publisher_snaps.add_url_rule(
    "/account/snaps/<snap_name>/metrics",
    view_func=metrics_views.get_measure_snap,
)
publisher_snaps.add_url_rule(
    "/<snap_name>/metrics",
    view_func=metrics_views.publisher_snap_metrics,
)

publisher_snaps.add_url_rule(
    "/<snap_name>/metrics/active-devices",
    view_func=metrics_views.get_active_devices,
)

publisher_snaps.add_url_rule(
    "/<snap_name>/metrics/active-latest-devices",
    view_func=metrics_views.get_latest_active_devices,
)

publisher_snaps.add_url_rule(
    "/<snap_name>/metrics/active-device-annotation",
    view_func=metrics_views.get_metric_annotaion,
)

publisher_snaps.add_url_rule(
    "/<snap_name>/metrics/country-metric",
    view_func=metrics_views.get_country_metric,
)

# Publice views
publisher_snaps.add_url_rule(
    "/<snap_name>/publicise",
    view_func=publicise_views.get_publicise,
)
publisher_snaps.add_url_rule(
    "/<snap_name>/publicise/badges",
    view_func=publicise_views.get_publicise_badges,
)
publisher_snaps.add_url_rule(
    "/<snap_name>/publicise/cards",
    view_func=publicise_views.get_publicise_cards,
)

# Settings views
publisher_snaps.add_url_rule(
    "/<snap_name>/settings",
    view_func=settings_views.get_settings,
)
publisher_snaps.add_url_rule(
    "/<snap_name>/settings.json",
    view_func=settings_views.get_settings_json,
)
publisher_snaps.add_url_rule(
    "/<snap_name>/settings",
    view_func=settings_views.post_settings,
    methods=["POST"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/settings.json",
    view_func=settings_views.post_settings_json,
    methods=["POST"],
)


@publisher_snaps.route("/account/snaps")
@login_required
def redirect_get_account_snaps():
    return flask.redirect(flask.url_for(".get_account_snaps"))


@publisher_snaps.route("/snaps")
@login_required
def get_account_snaps():
    account_info = publisher_api.get_account(flask.session)

    user_snaps, registered_snaps = logic.get_snaps_account_info(account_info)

    flask_user = flask.session["publisher"]

    is_users_snap = {
        snap_name: get_is_user_snap(snap_name)
        for snap_name in registered_snaps
    }

    context = {
        "snaps": user_snaps,
        "current_user": flask_user["nickname"],
        "registered_snaps": registered_snaps,
        "is_users_snap": is_users_snap,
    }

    return flask.render_template("publisher/account-snaps.html", **context)


@publisher_snaps.route("/snap-builds.json")
@login_required
def get_snap_build_status():
    try:
        account_info = publisher_api.get_account(flask.session)
    except (StoreApiError, ApiError) as api_error:
        return flask.jsonify(api_error), 400

    response = []
    user_snaps, _ = logic.get_snaps_account_info(account_info)

    for snap_name in user_snaps:
        snap_build_statuses = launchpad.get_snap_build_status(snap_name)
        status = map_snap_build_status(snap_build_statuses)

        response.append({"name": snap_name, "status": status})

    return flask.jsonify(response)


@publisher_snaps.route("/account/register-snap")
def redirect_get_register_name():
    return flask.redirect(flask.url_for(".get_register_name"))


@publisher_snaps.route("/register-snap")
@login_required
def get_register_name():
    stores = admin_api.get_stores(flask.session)

    available_stores = logic.filter_available_stores(stores)

    snap_name = flask.request.args.get("snap_name", default="", type=str)
    store = flask.request.args.get("store", default="", type=str)

    conflict_str = flask.request.args.get(
        "conflict", default="False", type=str
    )
    conflict = conflict_str == "True"

    already_owned_str = flask.request.args.get(
        "already_owned", default="False", type=str
    )
    already_owned = already_owned_str == "True"

    reserved_str = flask.request.args.get(
        "reserved", default="False", type=str
    )
    reserved = reserved_str == "True"

    is_private_str = flask.request.args.get(
        "is_private", default="False", type=str
    )
    is_private = is_private_str == "True"

    context = {
        "snap_name": snap_name,
        "is_private": is_private,
        "conflict": conflict,
        "already_owned": already_owned,
        "reserved": reserved,
        "store": store,
        "available_stores": available_stores,
    }
    return flask.render_template("publisher/register-snap.html", **context)


@publisher_snaps.route("/account/register-snap", methods=["POST"])
def redirect_post_register_name():
    return flask.redirect(flask.url_for(".post_register_name"), 307)


@publisher_snaps.route("/register-snap", methods=["POST"])
@login_required
def post_register_name():
    snap_name = flask.request.form.get("snap-name")

    if not snap_name:
        return flask.redirect(flask.url_for(".get_register_name"))

    is_private = flask.request.form.get("is_private") == "private"
    store = flask.request.form.get("store")
    registrant_comment = flask.request.form.get("registrant_comment")

    try:
        publisher_api.post_register_name(
            session=flask.session,
            snap_name=snap_name,
            is_private=is_private,
            store=store,
            registrant_comment=registrant_comment,
        )
    except StoreApiResponseErrorList as api_response_error_list:
        stores = admin_api.get_stores(flask.session)

        available_stores = logic.filter_available_stores(stores)

        if api_response_error_list.status_code == 409:
            for error in api_response_error_list.errors:
                if error["code"] == "already_claimed":
                    return flask.redirect("/admin/account")
                elif error["code"] == "already_registered":
                    return flask.redirect(
                        flask.url_for(
                            ".get_register_name",
                            snap_name=snap_name,
                            is_private=is_private,
                            store=store,
                            conflict=True,
                        )
                    )
                elif error["code"] == "already_owned":
                    return flask.redirect(
                        flask.url_for(
                            ".get_register_name",
                            snap_name=snap_name,
                            is_private=is_private,
                            store=store,
                            already_owned=True,
                        )
                    )
                elif error["code"] == "reserved_name":
                    return flask.redirect(
                        flask.url_for(
                            ".get_register_name",
                            snap_name=snap_name,
                            is_private=is_private,
                            store=store,
                            reserved=True,
                        )
                    )
                elif error["code"] == "name-review-required":
                    formatted_error = re.sub(
                        r"(https?://\S+)",
                        r'<a href="\1">\1</a>',
                        error["message"],
                    )
                    error["message"] = formatted_error

        context = {
            "snap_name": snap_name,
            "is_private": is_private,
            "available_stores": available_stores,
            "errors": api_response_error_list.errors,
        }

        return flask.render_template("publisher/register-snap.html", **context)

    flask.flash(
        "".join(
            [
                snap_name,
                " registered.",
                ' <a href="https://docs.snapcraft.io/build-snaps/upload"',
                " ",
                ' target="blank">How to upload a Snap</a>',
            ]
        )
    )

    return flask.redirect(flask.url_for("account.get_account"))


@publisher_snaps.route("/api/packages/<snap_name>", methods=["GET"])
@login_required
@exchange_required
def get_package_metadata(snap_name):
    package_metadata = publisher_api.get_package_metadata(
        flask.session, "snap", snap_name
    )
    if "metadata" in package_metadata and package_metadata["metadata"]:
        return jsonify({"data": package_metadata["metadata"], "success": True})
    else:
        return (
            jsonify({"error": "Package metadata not found", "success": False}),
            404,
        )


@publisher_snaps.route("/packages/<package_name>", methods=["DELETE"])
@login_required
@exchange_required
def delete_package(package_name):
    response = publisher_api.unregister_package_name(
        flask.session, package_name
    )

    if response.status_code == 200:
        return ("", 200)
    return (
        jsonify({"error": response.json()["error-list"][0]["message"]}),
        response.status_code,
    )


@publisher_snaps.route("/snap_info/user_snap/<snap_name>", methods=["GET"])
@login_required
def get_is_user_snap(snap_name):
    is_users_snap = False
    try:
        snap_info = publisher_api.get_snap_info(snap_name, flask.session)
    except (StoreApiError, ApiError) as api_error:
        return flask.jsonify({"error": str(api_error)}), 400

    if authentication.is_authenticated(flask.session):
        publisher_info = flask.session.get("publisher", {})
        if (
            publisher_info.get("nickname")
            == snap_info["publisher"]["username"]
        ):
            is_users_snap = True

    return {"is_users_snap": is_users_snap}


@publisher_snaps.route("/register-snap/json", methods=["POST"])
@login_required
def post_register_name_json():
    snap_name = flask.request.form.get("snap-name")

    if not snap_name:
        return (
            flask.jsonify({"errors": [{"message": "Snap name is required"}]}),
            400,
        )

    try:
        response = publisher_api.post_register_name(
            session=flask.session, snap_name=snap_name
        )
    except StoreApiResponseErrorList as api_response_error_list:
        for error in api_response_error_list.errors:
            # if snap name is already owned treat it as success
            if error["code"] == "already_owned":
                return flask.jsonify(
                    {"code": error["code"], "snap_name": snap_name}
                )
        return (
            flask.jsonify({"errors": api_response_error_list.errors}),
            api_response_error_list.status_code,
        )

    response["code"] = "created"

    return flask.jsonify(response)


@publisher_snaps.route("/register-name-dispute")
@login_required
def get_register_name_dispute():
    stores = admin_api.get_stores(flask.session)

    snap_name = flask.request.args.get("snap-name")
    store_id = flask.request.args.get("store")
    store_name = logic.get_store_name(store_id, stores)

    if not snap_name:
        return flask.redirect(
            flask.url_for(".get_register_name", snap_name=snap_name)
        )
    return flask.render_template(
        "publisher/register-name-dispute.html",
        snap_name=snap_name,
        store=store_name,
    )


@publisher_snaps.route("/register-name-dispute", methods=["POST"])
@login_required
def post_register_name_dispute():
    try:
        snap_name = flask.request.form.get("snap-name", "")
        claim_comment = flask.request.form.get("claim-comment", "")
        publisher_api.post_register_name_dispute(
            flask.session,
            bleach.clean(snap_name),
            bleach.clean(claim_comment),
        )
    except StoreApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code in [400, 409]:
            return flask.render_template(
                "publisher/register-name-dispute.html",
                snap_name=snap_name,
                errors=api_response_error_list.errors,
            )

    return flask.render_template(
        "publisher/register-name-dispute-success.html",
        snap_name=snap_name,
    )


@publisher_snaps.route("/request-reserved-name")
@login_required
def get_request_reserved_name():
    stores = admin_api.get_stores(flask.session)

    snap_name = flask.request.args.get("snap_name")
    store_id = flask.request.args.get("store")
    store_name = logic.get_store_name(store_id, stores)

    if not snap_name:
        return flask.redirect(
            flask.url_for(
                ".get_register_name", snap_name=snap_name, store=store_id
            )
        )
    return flask.render_template(
        "publisher/request-reserved-name.html",
        snap_name=snap_name,
        store=store_name,
    )


@publisher_snaps.route("/snaps/api/snap-count")
@login_required
def snap_count():
    account_info = publisher_api.get_account(flask.session)

    user_snaps, registered_snaps = logic.get_snaps_account_info(account_info)

    context = {"count": len(user_snaps), "snaps": list(user_snaps.keys())}

    return flask.jsonify(context)
