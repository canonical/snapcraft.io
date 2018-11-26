from json import loads

import flask

import pycountry
import webapp.api.dashboard as api
import webapp.metrics.helper as metrics_helper
import webapp.metrics.metrics as metrics
from webapp import authentication
from webapp.api.exceptions import (
    AgreementNotSigned,
    ApiError,
    ApiResponseError,
    ApiResponseErrorList,
    ApiTimeoutError,
    ApiCircuitBreaker,
    MacaroonRefreshRequired,
    MissingUsername,
)
from webapp.decorators import login_required
from webapp.helpers import get_licenses
from webapp.publisher.snaps import logic

publisher_snaps = flask.Blueprint(
    "publisher_snaps",
    __name__,
    template_folder="/templates",
    static_folder="/static",
)


def refresh_redirect(path):
    try:
        macaroon_discharge = authentication.get_refreshed_discharge(
            flask.session["macaroon_discharge"]
        )
    except ApiResponseError as api_response_error:
        if api_response_error.status_code == 401:
            return flask.redirect(flask.url_for("login.logout"))
        else:
            return flask.abort(502, str(api_response_error))
    except ApiError as api_error:
        return flask.abort(502, str(api_error))

    flask.session["macaroon_discharge"] = macaroon_discharge
    return flask.redirect(path)


def _handle_errors(api_error: ApiError):
    if type(api_error) is ApiTimeoutError:
        return flask.abort(504, str(api_error))
    elif type(api_error) is MissingUsername:
        return flask.redirect(flask.url_for("account.get_account_name"))
    elif type(api_error) is AgreementNotSigned:
        return flask.redirect(flask.url_for("account.get_agreement"))
    elif type(api_error) is MacaroonRefreshRequired:
        return refresh_redirect(flask.request.path)
    elif type(api_error) is ApiCircuitBreaker:
        return flask.abort(503)
    else:
        return flask.abort(502, str(api_error))


def _handle_error_list(errors):
    codes = [error["code"] for error in errors]

    error_messages = ", ".join(codes)
    return flask.abort(502, error_messages)


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
        return _handle_errors(api_error)

    user_snaps, registered_snaps = logic.get_snaps_account_info(account_info)

    flask_user = flask.session["openid"]

    context = {
        "snaps": user_snaps,
        "current_user": flask_user["nickname"],
        "registered_snaps": registered_snaps,
    }

    return flask.render_template("publisher/account-snaps.html", **context)


@publisher_snaps.route("/account/snaps/<snap_name>/measure")
@publisher_snaps.route("/account/snaps/<snap_name>/metrics")
@login_required
def get_measure_snap(snap_name):
    return flask.redirect(
        flask.url_for(".publisher_snap_metrics", snap_name=snap_name)
    )


@publisher_snaps.route("/<snap_name>/metrics")
@login_required
def publisher_snap_metrics(snap_name):
    """
    A view to display the snap metrics page for specific snaps.

    This queries the snapcraft API (api.snapcraft.io) and passes
    some of the data through to the publisher/metrics.html template,
    with appropriate sanitation.
    """
    try:
        details = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_errors(api_error)

    metric_requested = logic.extract_metrics_period(
        flask.request.args.get("period", default="30d", type=str)
    )

    installed_base_metric = logic.verify_base_metrics(
        flask.request.args.get("active-devices", default="version", type=str)
    )

    installed_base = logic.get_installed_based_metric(installed_base_metric)
    metrics_query_json = metrics_helper.build_metrics_json(
        snap_id=details["snap_id"],
        installed_base=installed_base,
        metric_period=metric_requested["int"],
        metric_bucket=metric_requested["bucket"],
    )

    try:
        metrics_response = api.get_publisher_metrics(
            flask.session, json=metrics_query_json
        )
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_errors(api_error)

    active_metrics = metrics_helper.find_metric(
        metrics_response["metrics"], installed_base
    )
    active_devices = metrics.ActiveDevices(
        name=active_metrics["metric_name"],
        series=active_metrics["series"],
        buckets=active_metrics["buckets"],
        status=active_metrics["status"],
    )

    latest_active = 0
    if active_devices:
        latest_active = active_devices.get_number_latest_active_devices()

    country_metric = metrics_helper.find_metric(
        metrics_response["metrics"], "weekly_installed_base_by_country"
    )
    country_devices = metrics.CountryDevices(
        name=country_metric["metric_name"],
        series=country_metric["series"],
        buckets=country_metric["buckets"],
        status=country_metric["status"],
        private=True,
    )

    territories_total = 0
    if country_devices:
        territories_total = country_devices.get_number_territories()

    nodata = not any([country_devices, active_devices])

    context = {
        # Data direct from details API
        "snap_name": snap_name,
        "snap_title": details["title"],
        "metric_period": metric_requested["period"],
        "active_device_metric": installed_base_metric,
        "private": details["private"],
        # Metrics data
        "nodata": nodata,
        "latest_active_devices": latest_active,
        "active_devices": dict(active_devices),
        "territories_total": territories_total,
        "territories": country_devices.country_data,
        # Context info
        "is_linux": "Linux" in flask.request.headers["User-Agent"],
    }

    return flask.render_template("publisher/metrics.html", **context)


@publisher_snaps.route("/account/snaps/<snap_name>/market")
@publisher_snaps.route("/account/snaps/<snap_name>/listing", methods=["GET"])
def get_market_snap(snap_name):
    return flask.redirect(
        flask.url_for(".get_listing_snap", snap_name=snap_name)
    )


@publisher_snaps.route("/<snap_name>/listing", methods=["GET"])
@login_required
def get_listing_snap(snap_name):
    try:
        snap_details = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_errors(api_error)

    details_metrics_enabled = snap_details["public_metrics_enabled"]
    details_blacklist = snap_details["public_metrics_blacklist"]

    is_on_stable = logic.is_snap_on_stable(snap_details["channel_maps_list"])

    # Filter icon & screenshot urls from the media set.
    icon_urls = [
        m["url"] for m in snap_details["media"] if m["type"] == "icon"
    ]
    screenshot_urls = [
        m["url"] for m in snap_details["media"] if m["type"] == "screenshot"
    ]

    licenses = []
    for license in get_licenses():
        licenses.append({"key": license["licenseId"], "name": license["name"]})

    license = snap_details["license"]
    license_type = "custom"

    if " AND " not in license.upper() and " WITH " not in license.upper():
        license_type = "simple"

    referrer = None

    if flask.request.args.get("from"):
        referrer = flask.request.args.get("from")

    context = {
        "snap_id": snap_details["snap_id"],
        "snap_name": snap_details["snap_name"],
        "snap_title": snap_details["title"],
        "summary": snap_details["summary"],
        "description": snap_details["description"],
        "icon_url": icon_urls[0] if icon_urls else None,
        "publisher_name": snap_details["publisher"]["display-name"],
        "username": snap_details["publisher"]["username"],
        "screenshot_urls": screenshot_urls,
        "contact": snap_details["contact"],
        "private": snap_details["private"],
        "website": snap_details["website"] or "",
        "public_metrics_enabled": details_metrics_enabled,
        "public_metrics_blacklist": details_blacklist,
        "license": license,
        "license_type": license_type,
        "licenses": licenses,
        "video_urls": snap_details["video_urls"],
        "is_on_stable": is_on_stable,
        "from": referrer,
    }

    return flask.render_template("publisher/listing.html", **context)


@publisher_snaps.route("/account/snaps/<snap_name>/listing", methods=["POST"])
def redirect_post_market_snap(snap_name):
    return flask.redirect(
        flask.url_for(".post_listing_snap", snap_name=snap_name)
    )


@publisher_snaps.route("/<snap_name>/listing", methods=["POST"])
@login_required
def post_listing_snap(snap_name):
    changes = None
    changed_fields = flask.request.form.get("changes")

    if changed_fields:
        changes = loads(changed_fields)

    if changes:
        snap_id = flask.request.form.get("snap_id")
        error_list = []

        if "images" in changes:
            # Add existing screenshots
            try:
                current_screenshots = api.snap_screenshots(
                    snap_id, flask.session
                )
            except ApiResponseErrorList as api_response_error_list:
                if api_response_error_list.status_code == 404:
                    return flask.abort(
                        404, "No snap named {}".format(snap_name)
                    )
                else:
                    return _handle_error_list(api_response_error_list.errors)
            except ApiError as api_error:
                return _handle_errors(api_error)

            images_json, images_files = logic.build_changed_images(
                changes["images"],
                current_screenshots,
                flask.request.files.get("icon"),
                flask.request.files.getlist("screenshots"),
            )

            try:
                api.snap_screenshots(
                    snap_id, flask.session, images_json, images_files
                )
            except ApiResponseErrorList as api_response_error_list:
                if api_response_error_list.status_code == 404:
                    return flask.abort(
                        404, "No snap named {}".format(snap_name)
                    )
                else:
                    error_list = error_list + api_response_error_list.errors
            except ApiError as api_error:
                return _handle_errors(api_error)

        body_json = logic.filter_changes_data(changes)

        if body_json:
            if "description" in body_json:
                body_json["description"] = logic.remove_invalid_characters(
                    body_json["description"]
                )

            try:
                api.snap_metadata(snap_id, flask.session, body_json)
            except ApiResponseErrorList as api_response_error_list:
                if api_response_error_list.status_code == 404:
                    return flask.abort(
                        404, "No snap named {}".format(snap_name)
                    )
                else:
                    error_list = error_list + api_response_error_list.errors
            except ApiError as api_error:
                return _handle_errors(api_error)

        if error_list:
            try:
                snap_details = api.get_snap_info(snap_name, flask.session)
            except ApiResponseErrorList as api_response_error_list:
                if api_response_error_list.status_code == 404:
                    return flask.abort(
                        404, "No snap named {}".format(snap_name)
                    )
                else:
                    error_list = error_list + api_response_error_list.errors
            except ApiError as api_error:
                return _handle_errors(api_error)

            field_errors, other_errors = logic.invalid_field_errors(error_list)

            details_metrics_enabled = snap_details["public_metrics_enabled"]
            details_blacklist = snap_details["public_metrics_blacklist"]

            is_on_stable = logic.is_snap_on_stable(
                snap_details["channel_maps_list"]
            )

            # Filter icon & screenshot urls from the media set.
            icon_urls = [
                m["url"] for m in snap_details["media"] if m["type"] == "icon"
            ]
            screenshot_urls = [
                m["url"]
                for m in snap_details["media"]
                if m["type"] == "screenshot"
            ]

            licenses = []
            for license in get_licenses():
                licenses.append(
                    {"key": license["licenseId"], "name": license["name"]}
                )

            license = snap_details["license"]
            license_type = "custom"

            if (
                " AND " not in license.upper()
                and " WITH " not in license.upper()
            ):
                license_type = "simple"

            context = {
                # read-only values from details API
                "snap_id": snap_details["snap_id"],
                "snap_name": snap_details["snap_name"],
                "icon_url": icon_urls[0] if icon_urls else None,
                "publisher_name": snap_details["publisher"]["display-name"],
                "username": snap_details["publisher"]["username"],
                "screenshot_urls": screenshot_urls,
                "display_title": snap_details["title"],
                # values posted by user
                "snap_title": (
                    changes["title"]
                    if "title" in changes
                    else snap_details["title"] or ""
                ),
                "summary": (
                    changes["summary"]
                    if "summary" in changes
                    else snap_details["summary"] or ""
                ),
                "description": (
                    changes["description"]
                    if "description" in changes
                    else snap_details["description"] or ""
                ),
                "contact": (
                    changes["contact"]
                    if "contact" in changes
                    else snap_details["contact"] or ""
                ),
                "private": snap_details["private"],
                "website": (
                    changes["website"]
                    if "website" in changes
                    else snap_details["website"] or ""
                ),
                "public_metrics_enabled": details_metrics_enabled,
                "video_urls": snap_details["video_urls"],
                "public_metrics_blacklist": details_blacklist,
                "license": license,
                "license_type": license_type,
                "licenses": licenses,
                "is_on_stable": is_on_stable,
                # errors
                "error_list": error_list,
                "field_errors": field_errors,
                "other_errors": other_errors,
            }

            return flask.render_template("publisher/listing.html", **context)

        flask.flash("Changes applied successfully.", "positive")
    else:
        flask.flash("No changes to save.", "information")

    return flask.redirect(
        flask.url_for(".get_listing_snap", snap_name=snap_name)
    )


@publisher_snaps.route("/account/snaps/<snap_name>/release")
@publisher_snaps.route("/<snap_name>/release")
@login_required
def redirect_get_release_history(snap_name):
    return flask.redirect(
        flask.url_for(".get_release_history", snap_name=snap_name)
    )


@publisher_snaps.route("/<snap_name>/releases")
@login_required
def get_release_history(snap_name):
    try:
        release_history = api.snap_release_history(flask.session, snap_name)
    except ApiResponseErrorList as api_response_error_list:
        return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_errors(api_error)

    try:
        info = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_errors(api_error)

    context = {
        "snap_name": snap_name,
        "release_history": release_history,
        "private": info.get("private"),
        "channel_maps_list": info.get("channel_maps_list"),
    }

    return flask.render_template("publisher/release-history.html", **context)


@publisher_snaps.route("/account/snaps/<snap_name>/release", methods=["POST"])
@publisher_snaps.route("/<snap_name>/release", methods=["POST"])
@login_required
def redirect_post_release(snap_name):
    return flask.redirect(
        flask.url_for(".post_release", snap_name=snap_name), 307
    )


@publisher_snaps.route("/<snap_name>/releases/json")
@login_required
def get_release_history_json(snap_name):
    page = flask.request.args.get("page", default=1, type=int)

    try:
        release_history = api.snap_release_history(
            flask.session, snap_name, page
        )
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return flask.jsonify(api_response_error_list.errors), 400
    except ApiError as api_error:
        return _handle_errors(api_error)

    return flask.jsonify(release_history)


@publisher_snaps.route("/<snap_name>/releases", methods=["POST"])
@login_required
def post_release(snap_name):
    data = flask.request.json

    if not data:
        return flask.jsonify({})

    try:
        response = api.post_snap_release(flask.session, snap_name, data)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return flask.jsonify(api_response_error_list.errors), 400
    except ApiError as api_error:
        return _handle_errors(api_error)

    return flask.jsonify(response)


@publisher_snaps.route("/<snap_name>/release/close-channel", methods=["POST"])
@login_required
def redirect_post_close_channel(snap_name):
    return flask.redirect(
        flask.url_for(".post_close_channel", snap_name=snap_name), 307
    )


@publisher_snaps.route("/<snap_name>/releases/close-channel", methods=["POST"])
@login_required
def post_close_channel(snap_name):
    data = flask.request.json

    if not data:
        return flask.jsonify({})

    try:
        snap_id = api.get_snap_id(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return flask.jsonify(api_response_error_list.errors), 400
    except ApiError as api_error:
        return _handle_errors(api_error)

    try:
        response = api.post_close_channel(flask.session, snap_id, data)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            response = {
                "errors": api_response_error_list.errors,
                "success": False,
            }
            return flask.jsonify(response), 400
    except ApiError as api_error:
        return _handle_errors(api_error)

    response["success"] = True
    return flask.jsonify(response)


@publisher_snaps.route("/account/register-snap")
def redirect_get_register_name():
    return flask.redirect(flask.url_for(".get_register_name"))


@publisher_snaps.route("/register-snap")
@login_required
def get_register_name():
    snap_name = flask.request.args.get("snap_name", default="", type=str)
    is_private_str = flask.request.args.get(
        "is_private", default="False", type=str
    )
    is_private = is_private_str == "True"

    conflict_str = flask.request.args.get(
        "conflict", default="False", type=str
    )
    conflict = conflict_str == "True"

    already_owned_str = flask.request.args.get(
        "already_owned", default="False", type=str
    )
    already_owned = already_owned_str == "True"

    is_private_str = flask.request.args.get(
        "is_private", default="False", type=str
    )
    is_private = is_private_str == "True"

    context = {
        "snap_name": snap_name,
        "is_private": is_private,
        "conflict": conflict,
        "already_owned": already_owned,
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
                            conflict=True,
                        )
                    )
                elif error["code"] == "already_owned":
                    return flask.redirect(
                        flask.url_for(
                            ".get_register_name",
                            snap_name=snap_name,
                            is_private=is_private,
                            already_owned=True,
                        )
                    )

        context = {
            "snap_name": snap_name,
            "is_private": is_private,
            "errors": api_response_error_list.errors,
        }

        return flask.render_template("publisher/register-snap.html", **context)
    except ApiError as api_error:
        return _handle_errors(api_error)

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


@publisher_snaps.route("/<snap_name>/settings")
@login_required
def get_settings(snap_name):
    try:
        snap_details = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_errors(api_error)

    if "whitelist_country_codes" in snap_details:
        whitelist_country_codes = (
            snap_details["whitelist_country_codes"]
            if len(snap_details["whitelist_country_codes"]) > 0
            else []
        )
    else:
        whitelist_country_codes = []

    if "blacklist_country_codes" in snap_details:
        blacklist_country_codes = (
            snap_details["blacklist_country_codes"]
            if len(snap_details["blacklist_country_codes"]) > 0
            else []
        )
    else:
        blacklist_country_codes = []

    countries = []
    for country in pycountry.countries:
        countries.append({"key": country.alpha_2, "name": country.name})

    context = {
        "snap_name": snap_details["snap_name"],
        "snap_title": snap_details["title"],
        "snap_id": snap_details["snap_id"],
        "license": license,
        "private": snap_details["private"],
        "countries": countries,
        "whitelist_country_codes": whitelist_country_codes,
        "blacklist_country_codes": blacklist_country_codes,
        "price": snap_details["price"],
        "store": snap_details["store"],
        "keywords": snap_details["keywords"],
        "status": snap_details["status"],
    }

    return flask.render_template("publisher/settings.html", **context)


@publisher_snaps.route("/<snap_name>/settings", methods=["POST"])
@login_required
def post_settings(snap_name):
    changes = None
    changed_fields = flask.request.form.get("changes")

    if changed_fields:
        changes = loads(changed_fields)

    if changes:
        snap_id = flask.request.form.get("snap_id")
        error_list = []

        body_json = logic.filter_changes_data(changes)

        if body_json:
            if "public_metrics_blacklist" in body_json:
                converted_metrics = logic.convert_metrics_blacklist(
                    body_json["public_metrics_blacklist"]
                )
                body_json["public_metrics_blacklist"] = converted_metrics

            try:
                api.snap_metadata(snap_id, flask.session, body_json)
            except ApiResponseErrorList as api_response_error_list:
                if api_response_error_list.status_code == 404:
                    return flask.abort(
                        404, "No snap named {}".format(snap_name)
                    )
                else:
                    error_list = error_list + api_response_error_list.errors
            except ApiError as api_error:
                return _handle_errors(api_error)

        if error_list:
            try:
                snap_details = api.get_snap_info(snap_name, flask.session)
            except ApiResponseErrorList as api_response_error_list:
                if api_response_error_list.status_code == 404:
                    return flask.abort(
                        404, "No snap named {}".format(snap_name)
                    )
                else:
                    error_list = error_list + api_response_error_list.errors
            except ApiError as api_error:
                return _handle_errors(api_error)

            field_errors, other_errors = logic.invalid_field_errors(error_list)

            countries = []
            for country in pycountry.countries:
                countries.append(
                    {"key": country.alpha_2, "name": country.name}
                )

            if "whitelist_country_codes" in snap_details:
                whitelist_country_codes = (
                    snap_details["whitelist_country_codes"]
                    if len(snap_details["whitelist_country_codes"]) > 0
                    else []
                )
            else:
                whitelist_country_codes = []

            if "blacklist_country_codes" in snap_details:
                blacklist_country_codes = (
                    snap_details["blacklist_country_codes"]
                    if len(snap_details["blacklist_country_codes"]) > 0
                    else []
                )
            else:
                blacklist_country_codes = []

            context = {
                # read-only values from details API
                "snap_name": snap_details["snap_name"],
                "snap_title": snap_details["title"],
                "snap_id": snap_details["snap_id"],
                "private": snap_details["private"],
                "countries": countries,
                "whitelist_country_codes": whitelist_country_codes,
                "blacklist_country_codes": blacklist_country_codes,
                "price": snap_details["price"],
                "store": snap_details["store"],
                "keywords": snap_details["keywords"],
                "status": snap_details["status"],
                # errors
                "error_list": error_list,
                "field_errors": field_errors,
                "other_errors": other_errors,
            }

            return flask.render_template("publisher/settings.html", **context)

        flask.flash("Changes applied successfully.", "positive")
    else:
        flask.flash("No changes to save.", "information")

    return flask.redirect(flask.url_for(".get_settings", snap_name=snap_name))


@publisher_snaps.route("/snaps/api/snap-count")
@login_required
def snap_count():
    try:
        account_info = api.get_account(flask.session)
    except ApiResponseErrorList as api_response_error_list:
        return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_errors(api_error)

    user_snaps, registered_snaps = logic.get_snaps_account_info(account_info)

    context = {"count": len(user_snaps), "snaps": list(user_snaps.keys())}

    return flask.jsonify(context)


@publisher_snaps.route("/<snap_name>/publicise")
@login_required
def get_publicise(snap_name):
    try:
        snap_details = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_errors(api_error)

    if snap_details["private"]:
        return flask.abort(404, "No snap named {}".format(snap_name))

    available_languages = {
        "en": {"title": "English", "text": "Get it from the Snap Store"},
        "de": {"title": "Deutsch", "text": "Installieren vom Snap Store"},
        "es": {"title": "Español", "text": "Instalar desde Snap Store"},
        "fr": {
            "title": "Français",
            "text": "Installer à partir du Snap Store",
        },
        "jp": {"title": "日本語", "text": "Snap Store から入手ください"},
        "ru": {"title": "русский язык", "text": "Загрузите из Snap Store"},
        "tw": {"title": "中文（台灣）", "text": "安裝軟體敬請移駕 Snap Store"},
    }

    context = {
        "snap_name": snap_details["snap_name"],
        "snap_title": snap_details["title"],
        "snap_id": snap_details["snap_id"],
        "available": available_languages,
        "download_version": "v1.1",
    }

    return flask.render_template("publisher/publicise.html", **context)
