# Packages
import bleach
import flask

# Local
import webapp.api.dashboard as api
from webapp.api.exceptions import (
    ApiError,
    ApiResponseErrorList,
)
from webapp.decorators import login_required
from webapp.publisher.snaps import (
    build_views,
    listing_views,
    logic,
    metrics_views,
    publicise_views,
    release_views,
    settings_views,
)
from webapp.publisher.views import _handle_error, _handle_error_list

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
    "/<snap_name>/listing",
    view_func=listing_views.post_listing_snap,
    methods=["POST"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/preview",
    view_func=listing_views.post_preview,
    methods=["POST"],
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
    view_func=build_views.post_update_gh_webhooks,
    methods=["POST"],
)
publisher_snaps.add_url_rule(
    "/<snap_name>/builds/disconnect/",
    view_func=build_views.get_disconnect_repo,
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
    "/<snap_name>/metrics", view_func=metrics_views.publisher_snap_metrics,
)

# Publice views
publisher_snaps.add_url_rule(
    "/<snap_name>/publicise", view_func=publicise_views.get_publicise,
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
    "/<snap_name>/settings", view_func=settings_views.get_settings,
)
publisher_snaps.add_url_rule(
    "/<snap_name>/settings",
    view_func=settings_views.post_settings,
    methods=["POST"],
)


@publisher_snaps.route("/account/snaps")
@login_required
def redirect_get_account_snaps():
    return flask.redirect(flask.url_for(".get_account_snaps"))


@publisher_snaps.route("/snaps")
@login_required
def get_account_snaps():
    try:
        account_info = api.get_account(flask.session)
    except ApiResponseErrorList as api_response_error_list:
        return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

    user_snaps, registered_snaps = logic.get_snaps_account_info(account_info)

    flask_user = flask.session["openid"]

    context = {
        "snaps": user_snaps,
        "current_user": flask_user["nickname"],
        "registered_snaps": registered_snaps,
    }

    return flask.render_template("publisher/account-snaps.html", **context)


@publisher_snaps.route("/account/register-snap")
def redirect_get_register_name():
    return flask.redirect(flask.url_for(".get_register_name"))


@publisher_snaps.route("/register-snap")
@login_required
def get_register_name():
    try:
        user = api.get_account(flask.session)
    except ApiError as api_error:
        return _handle_error(api_error)

    available_stores = logic.filter_available_stores(user["stores"])

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
        api.post_register_name(
            session=flask.session,
            snap_name=snap_name,
            is_private=is_private,
            store=store,
            registrant_comment=registrant_comment,
        )
    except ApiResponseErrorList as api_response_error_list:
        try:
            user = api.get_account(flask.session)
        except ApiError as api_error:
            return _handle_error(api_error)

        available_stores = logic.filter_available_stores(user["stores"])

        if api_response_error_list.status_code == 409:
            for error in api_response_error_list.errors:
                if error["code"] == "already_claimed":
                    return flask.redirect(
                        flask.url_for("account.get_account_details")
                    )
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

        context = {
            "snap_name": snap_name,
            "is_private": is_private,
            "available_stores": available_stores,
            "errors": api_response_error_list.errors,
        }

        return flask.render_template("publisher/register-snap.html", **context)
    except ApiError as api_error:
        return _handle_error(api_error)

    flask.flash(
        "".join(
            [
                snap_name,
                " registered.",
                ' <a href="https://docs.snapcraft.io/build-snaps/upload"',
                ' class="p-link--external"',
                ' target="blank">How to upload a Snap</a>',
            ]
        )
    )

    return flask.redirect(flask.url_for("account.get_account"))


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
        response = api.post_register_name(
            session=flask.session, snap_name=snap_name
        )
    except ApiResponseErrorList as api_response_error_list:
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
    except ApiError as api_error:
        return _handle_error(api_error)

    response["code"] = "created"

    return flask.jsonify(response)


@publisher_snaps.route("/register-name-dispute")
@login_required
def get_register_name_dispute():
    snap_name = flask.request.args.get("snap-name")
    if not snap_name:
        return flask.redirect(
            flask.url_for(".get_register_name", snap_name=snap_name)
        )
    return flask.render_template(
        "publisher/register-name-dispute.html", snap_name=snap_name
    )


@publisher_snaps.route("/register-name-dispute", methods=["POST"])
@login_required
def post_register_name_dispute():
    try:
        snap_name = flask.request.form.get("snap-name", "")
        claim_comment = flask.request.form.get("claim-comment", "")
        api.post_register_name_dispute(
            flask.session, bleach.clean(snap_name), bleach.clean(claim_comment)
        )
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code in [400, 409]:
            return flask.render_template(
                "publisher/register-name-dispute.html",
                snap_name=snap_name,
                errors=api_response_error_list.errors,
            )
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

    return flask.render_template(
        "publisher/register-name-dispute-success.html", snap_name=snap_name
    )


@publisher_snaps.route("/request-reserved-name")
@login_required
def get_request_reserved_name():
    snap_name = flask.request.args.get("snap_name")
    if not snap_name:
        return flask.redirect(
            flask.url_for(".get_register_name", snap_name=snap_name)
        )
    return flask.render_template(
        "publisher/request-reserved-name.html", snap_name=snap_name
    )


@publisher_snaps.route("/snaps/api/snap-count")
@login_required
def snap_count():
    try:
        account_info = api.get_account(flask.session)
    except ApiResponseErrorList as api_response_error_list:
        return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

    user_snaps, registered_snaps = logic.get_snaps_account_info(account_info)

    context = {"count": len(user_snaps), "snaps": list(user_snaps.keys())}

    return flask.jsonify(context)
