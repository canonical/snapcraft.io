import os
from json import loads

import flask
import talisker.requests
import bleach
import pycountry
import webapp.helpers as helpers
from webapp.markdown import parse_markdown_description
import webapp.api.dashboard as api
import webapp.metrics.helper as metrics_helper
import webapp.metrics.metrics as metrics
from webapp import authentication
from webapp.api import requests
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
from canonicalwebteam.store_api.stores.snapcraft import SnapcraftStoreApi
from canonicalwebteam.store_api.exceptions import (
    StoreApiError,
    StoreApiTimeoutError,
    StoreApiCircuitBreaker,
)
from webapp.api.github import GitHubAPI
from webapp.api.launchpad import Launchpad
from webapp.store.logic import (
    get_categories,
    filter_screenshots,
    get_icon,
    get_videos,
)
from webapp.decorators import login_required
from webapp.helpers import get_licenses
from webapp.publisher.snaps import logic, preview_data
from webapp.publisher.snaps.builds import (
    build_link,
    map_build_and_upload_states,
)
from werkzeug.exceptions import Unauthorized


publisher_snaps = flask.Blueprint(
    "publisher_snaps",
    __name__,
    template_folder="/templates",
    static_folder="/static",
)

store_api = SnapcraftStoreApi(talisker.requests.get_session(requests.Session))
launchpad = Launchpad(
    username=os.getenv("LP_API_USERNAME"),
    token=os.getenv("LP_API_TOKEN"),
    signature=os.getenv("LP_API_TOKEN_SECRET"),
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


def _handle_error(api_error: ApiError):
    if type(api_error) in [ApiTimeoutError, StoreApiTimeoutError]:
        return flask.abort(504, str(api_error))
    elif type(api_error) is MissingUsername:
        return flask.redirect(flask.url_for("account.get_account_name"))
    elif type(api_error) is AgreementNotSigned:
        return flask.redirect(flask.url_for("account.get_agreement"))
    elif type(api_error) is MacaroonRefreshRequired:
        return refresh_redirect(flask.request.path)
    elif type(api_error) in [ApiCircuitBreaker, StoreApiCircuitBreaker]:
        return flask.abort(503)
    else:
        return flask.abort(502, str(api_error))


def _handle_error_list(errors):
    codes = [
        f"{error['code']}: {error.get('message', 'No message')}"
        for error in errors
    ]

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
        return _handle_error(api_error)

    user_snaps, registered_snaps = logic.get_snaps_account_info(account_info)

    flask_user = flask.session["openid"]

    context = {
        "snaps": user_snaps,
        "current_user": flask_user["nickname"],
        "registered_snaps": registered_snaps,
    }

    return flask.render_template("publisher/account-snaps.html", **context)


@publisher_snaps.route("/snaps/metrics/json", methods=["POST"])
@login_required
def get_account_snaps_metrics():
    if not flask.request.data:
        error = {"error": "Please provide a list of snaps"}
        return flask.jsonify(error), 500

    try:
        metrics = {"buckets": [], "snaps": []}

        snaps = loads(flask.request.data)
        metrics_query = metrics_helper.build_snap_installs_metrics_query(snaps)

        if metrics_query:
            snap_metrics = api.get_publisher_metrics(
                flask.session, json=metrics_query
            )
            metrics = metrics_helper.transform_metrics(
                metrics, snap_metrics, snaps
            )
        return flask.jsonify(metrics), 200
    except Exception:
        error = {"error": "An error occured while fetching metrics"}
        return flask.jsonify(error), 500


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
        return _handle_error(api_error)

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
        return _handle_error(api_error)

    try:
        latest_day_period = logic.extract_metrics_period("1d")
        latest_installed_base = logic.get_installed_based_metric("version")
        latest_day_query_json = metrics_helper.build_metrics_json(
            snap_id=details["snap_id"],
            installed_base=latest_installed_base,
            metric_period=latest_day_period["int"],
            metric_bucket=latest_day_period["bucket"],
        )
        latest_day_response = api.get_publisher_metrics(
            flask.session, json=latest_day_query_json
        )
    except ApiResponseErrorList as api_response_error_list:
        return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

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

    if latest_day_response:
        latest_active_metrics = metrics_helper.find_metric(
            latest_day_response["metrics"], latest_installed_base
        )
        if latest_active_metrics:
            latest_active_devices = metrics.ActiveDevices(
                name=latest_active_metrics["metric_name"],
                series=latest_active_metrics["series"],
                buckets=latest_active_metrics["buckets"],
                status=latest_active_metrics["status"],
            )
            latest_active = (
                latest_active_devices.get_number_latest_active_devices()
            )

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

    # until default tracks are supported by the API we special case node
    # to use 10, rather then latest
    default_track = helpers.get_default_track(snap_name)

    annotations = {"name": "annotations", "series": [], "buckets": []}

    for category in details["categories"]["items"]:
        date = category["since"].split("T")[0]
        new_date = logic.convert_date(category["since"])

        if date not in annotations["buckets"]:
            annotations["buckets"].append(date)

        index_of_date = annotations["buckets"].index(date)

        single_series = {
            "values": [0] * (len(annotations)),
            "name": category["name"],
            "display_name": category["name"].capitalize().replace("-", " "),
            "display_date": new_date,
            "date": date,
        }

        single_series["values"][index_of_date] = 1

        annotations["series"].append(single_series)

    annotations["series"] = sorted(
        annotations["series"], key=lambda k: k["date"]
    )

    context = {
        # Data direct from details API
        "snap_name": snap_name,
        "snap_title": details["title"],
        "publisher_name": details["publisher"]["display-name"],
        "metric_period": metric_requested["period"],
        "active_device_metric": installed_base_metric,
        "default_track": default_track,
        "private": details["private"],
        # Metrics data
        "nodata": nodata,
        "latest_active_devices": latest_active,
        "active_devices": dict(active_devices),
        "territories_total": territories_total,
        "territories": country_devices.country_data,
        "active_devices_annotations": annotations,
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
        return _handle_error(api_error)

    details_metrics_enabled = snap_details["public_metrics_enabled"]
    details_blacklist = snap_details["public_metrics_blacklist"]

    is_on_stable = logic.is_snap_on_stable(snap_details["channel_maps_list"])

    # Filter icon & screenshot urls from the media set.
    icon_urls, screenshot_urls, banner_urls = logic.categorise_media(
        snap_details["media"]
    )

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

    try:
        categories_results = store_api.get_categories()
    except StoreApiError:
        categories_results = []

    categories = sorted(
        get_categories(categories_results),
        key=lambda category: category["slug"],
    )

    snap_categories = logic.replace_reserved_categories_key(
        snap_details["categories"]
    )

    snap_categories = logic.filter_categories(snap_categories)

    snap_categories["categories"] = [
        category["name"] for category in snap_categories["categories"]
    ]

    filename = f"publisher/content/listing_tour.yaml"
    tour_steps = helpers.get_yaml(filename, typ="rt")

    context = {
        "snap_id": snap_details["snap_id"],
        "snap_name": snap_details["snap_name"],
        "snap_title": snap_details["title"],
        "snap_categories": snap_categories,
        "summary": snap_details["summary"],
        "description": snap_details["description"],
        "icon_url": icon_urls[0] if icon_urls else None,
        "publisher_name": snap_details["publisher"]["display-name"],
        "username": snap_details["publisher"]["username"],
        "screenshot_urls": screenshot_urls,
        "banner_urls": banner_urls,
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
        "categories": categories,
        "tour_steps": tour_steps,
        "status": snap_details["status"],
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
                return _handle_error(api_error)

            images_json, images_files = logic.build_changed_images(
                changes["images"],
                current_screenshots,
                flask.request.files.get("icon"),
                flask.request.files.getlist("screenshots"),
                flask.request.files.get("banner-image"),
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
                return _handle_error(api_error)

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
                return _handle_error(api_error)

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
                return _handle_error(api_error)

            field_errors, other_errors = logic.invalid_field_errors(error_list)

            details_metrics_enabled = snap_details["public_metrics_enabled"]
            details_blacklist = snap_details["public_metrics_blacklist"]

            is_on_stable = logic.is_snap_on_stable(
                snap_details["channel_maps_list"]
            )

            # Filter icon & screenshot urls from the media set.
            icon_urls, screenshot_urls, banner_urls = logic.categorise_media(
                snap_details["media"]
            )

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

            try:
                categories_results = store_api.get_categories()
            except StoreApiError:
                categories_results = []

            categories = get_categories(categories_results)

            snap_categories = logic.replace_reserved_categories_key(
                snap_details["categories"]
            )

            snap_categories = logic.filter_categories(snap_categories)

            filename = f"publisher/content/listing_tour.yaml"
            tour_steps = helpers.get_yaml(filename, typ="rt")

            context = {
                # read-only values from details API
                "snap_id": snap_details["snap_id"],
                "snap_name": snap_details["snap_name"],
                "snap_categories": snap_categories,
                "icon_url": icon_urls[0] if icon_urls else None,
                "username": snap_details["publisher"]["username"],
                "screenshot_urls": screenshot_urls,
                "banner_urls": banner_urls,
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
                "video_urls": (
                    [changes["video_urls"]]
                    if "video_urls" in changes
                    else snap_details["video_urls"]
                ),
                "public_metrics_blacklist": details_blacklist,
                "license": license,
                "license_type": license_type,
                "licenses": licenses,
                "is_on_stable": is_on_stable,
                "categories": categories,
                "publisher_name": snap_details["publisher"]["display-name"],
                # errors
                "error_list": error_list,
                "field_errors": field_errors,
                "other_errors": other_errors,
                "tour_steps": tour_steps,
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
        return _handle_error(api_error)

    try:
        info = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

    context = {
        "snap_name": snap_name,
        "snap_title": info["title"],
        "publisher_name": info["publisher"]["display-name"],
        "release_history": release_history,
        "private": info.get("private"),
        "channel_maps_list": info.get("channel_maps_list"),
        "default_track": info.get("default_track"),
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
        return _handle_error(api_error)

    return flask.jsonify(release_history)


@publisher_snaps.route("/<snap_name>/releases", methods=["POST"])
@login_required
def post_release(snap_name):
    data = flask.request.json

    if not data:
        return flask.jsonify({}), 400

    try:
        response = api.post_snap_release(flask.session, snap_name, data)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return flask.jsonify(api_response_error_list.errors), 400
    except ApiError as api_error:
        return _handle_error(api_error)

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
        return flask.jsonify({}), 400

    try:
        snap_id = api.get_snap_id(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return flask.jsonify(api_response_error_list.errors), 400
    except ApiError as api_error:
        return _handle_error(api_error)

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
        return _handle_error(api_error)

    response["success"] = True
    return flask.jsonify(response)


@publisher_snaps.route("/<snap_name>/releases/default-track", methods=["POST"])
@login_required
def post_default_track(snap_name):
    data = flask.request.json

    if not data:
        return flask.jsonify({}), 400

    try:
        snap_id = api.get_snap_id(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return flask.jsonify(api_response_error_list.errors), 400
    except ApiError as api_error:
        return _handle_error(api_error)

    try:
        api.snap_metadata(snap_id, flask.session, data)
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
        return _handle_error(api_error)

    return flask.jsonify({"success": True})


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
        return _handle_error(api_error)

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
        "publisher_name": snap_details["publisher"]["display-name"],
        "license": license,
        "private": snap_details["private"],
        "unlisted": snap_details["unlisted"],
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
                return _handle_error(api_error)

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
                return _handle_error(api_error)

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
                "publisher_name": snap_details["publisher"]["display-name"],
                "snap_id": snap_details["snap_id"],
                "private": snap_details["private"],
                "unlisted": snap_details["unlisted"],
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
        return _handle_error(api_error)

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
        return _handle_error(api_error)

    available_languages = {
        "de": {"title": "Deutsch", "text": "Installieren vom Snap Store"},
        "en": {"title": "English", "text": "Get it from the Snap Store"},
        "es": {"title": "Español", "text": "Instalar desde Snap Store"},
        "fr": {
            "title": "Français",
            "text": "Installer à partir du Snap Store",
        },
        "it": {"title": "Italiano", "text": "Scarica dallo Snap Store"},
        "jp": {"title": "日本語", "text": "Snap Store から入手ください"},
        "pl": {"title": "Polski", "text": "Pobierz w Snap Store"},
        "pt": {"title": "Português", "text": "Disponível na Snap Store"},
        "ru": {"title": "русский язык", "text": "Загрузите из Snap Store"},
        "tw": {"title": "中文（台灣）", "text": "安裝軟體敬請移駕 Snap Store"},
    }

    context = {
        "private": snap_details["private"],
        "snap_name": snap_details["snap_name"],
        "snap_title": snap_details["title"],
        "publisher_name": snap_details["publisher"]["display-name"],
        "snap_id": snap_details["snap_id"],
        "available": available_languages,
        "download_version": "v1.3",
    }

    return flask.render_template(
        "publisher/publicise/store_buttons.html", **context
    )


@publisher_snaps.route("/<snap_name>/publicise/badges")
@login_required
def get_publicise_badges(snap_name):
    try:
        snap_details = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

    if snap_details["private"]:
        return flask.abort(404, "No snap named {}".format(snap_name))

    try:
        snap_public_details = store_api.get_item_details(
            snap_name, api_version=2
        )
    except StoreApiError as api_error:
        return _handle_error(api_error)

    context = {
        "snap_name": snap_details["snap_name"],
        "snap_title": snap_details["title"],
        "publisher_name": snap_details["publisher"]["display-name"],
        "snap_id": snap_details["snap_id"],
        "trending": snap_public_details["snap"]["trending"],
    }

    return flask.render_template(
        "publisher/publicise/github_badges.html", **context
    )


@publisher_snaps.route("/<snap_name>/publicise/cards")
@login_required
def get_publicise_cards(snap_name):
    try:
        snap_details = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

    if snap_details["private"]:
        return flask.abort(404, "No snap named {}".format(snap_name))

    screenshots = filter_screenshots(snap_details["media"])
    has_screenshot = True if screenshots else False

    context = {
        "has_screenshot": has_screenshot,
        "snap_name": snap_details["snap_name"],
        "snap_title": snap_details["title"],
        "publisher_name": snap_details["publisher"]["display-name"],
        "snap_id": snap_details["snap_id"],
    }

    return flask.render_template(
        "publisher/publicise/embedded_cards.html", **context
    )


@publisher_snaps.route("/<snap_name>/preview", methods=["POST"])
@login_required
def post_preview(snap_name):
    try:
        snap_details = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

    context = {
        "publisher": snap_details["publisher"]["display-name"],
        "username": snap_details["publisher"]["username"],
        "developer_validation": snap_details["publisher"]["validation"],
    }

    state = loads(flask.request.form["state"])

    for item in state:
        if item == "description":
            context[item] = parse_markdown_description(
                bleach.clean(state[item], tags=[])
            )
        else:
            context[item] = state[item]

    context["is_preview"] = True
    context["package_name"] = context["snap_name"]
    context["snap_title"] = context["title"]

    # Images
    icons = get_icon(context["images"])
    context["screenshots"] = filter_screenshots(context["images"])
    context["icon_url"] = icons[0] if icons else None
    context["videos"] = get_videos(context["images"])

    # Channel map
    context["default_track"] = "latest"
    context["lowest_risk_available"] = "stable"
    context["version"] = "test"
    context["has_stable"] = True

    # metadata
    context["last_updated"] = "Preview"
    context["filesize"] = "1mb"

    # maps
    context["countries"] = preview_data.get_countries()
    context["normalized_os"] = preview_data.get_normalised_oses()

    return flask.render_template("store/snap-details.html", **context)


@publisher_snaps.route("/<snap_name>/builds", methods=["GET"])
@login_required
def get_snap_builds(snap_name):
    try:
        details = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

    context = {
        "snap_id": details["snap_id"],
        "snap_name": details["snap_name"],
        "snap_title": details["title"],
        "snap_builds_enabled": False,
        "snap_builds": [],
    }

    # Get built snap in launchpad with this store name
    github = GitHubAPI(flask.session.get("github_auth_secret"))
    lp_snap = launchpad.get_snap_by_store_name(details["snap_name"])

    if lp_snap:
        # Git repository without GitHub hostname
        context["github_repository"] = lp_snap["git_repository_url"][19:]
        github_owner, github_repo = context["github_repository"].split("/")

        context["yaml_file_exists"] = github.is_snapcraft_yaml_present(
            github_owner, github_repo
        )

        if not context["yaml_file_exists"]:
            flask.flash(
                "This repository doesn't contain a snapcraft.yaml", "negative",
            )

        bsi_url = flask.current_app.config["BSI_URL"]

        builds = launchpad.get_collection_entries(
            # Remove first part of the URL
            lp_snap["builds_collection_link"][32:]
        )

        context["snap_builds_enabled"] = bool(builds)

        for build in builds:
            link = build_link(bsi_url, lp_snap, build)
            status = map_build_and_upload_states(
                build["buildstate"], build["store_upload_status"]
            )

            context["snap_builds"].append(
                {
                    "id": build["self_link"].split("/")[-1],
                    "arch_tag": build["arch_tag"],
                    "datebuilt": build["datebuilt"],
                    "duration": build["duration"],
                    "link": link,
                    "logs": build["build_log_url"],
                    "revision_id": build["revision_id"],
                    "status": status,
                    "title": build["title"],
                }
            )
    else:
        try:
            context["github_user"] = github.get_username()
        except Unauthorized:
            context["github_user"] = None

        if context["github_user"]:
            # Get snapcraft repositories sorted by snapcraft_yaml
            context["github_repositories"] = sorted(
                github.get_user_repositories(),
                key=lambda k: k["snapcraft_yaml"],
                reverse=True,
            )

    return flask.render_template("publisher/builds.html", **context)


@publisher_snaps.route("/<snap_name>/builds", methods=["POST"])
@login_required
def post_snap_builds(snap_name):
    try:
        details = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

    # Get built snap in launchpad with this store name
    lp_snap = launchpad.get_snap_by_store_name(details["snap_name"])
    github_repo = flask.request.form.get("github_repository")
    git_url = f"https://github.com/{github_repo}"

    if not lp_snap:
        launchpad.new_snap(snap_name, git_url)
        flask.flash("The GitHub repository was linked correctly.", "positive")
    elif lp_snap["git_repository_url"] != git_url:
        # In the future, create a new record, delete the old one
        raise AttributeError(
            f"Snap {snap_name} already has a build repository associated"
        )

    return flask.redirect(
        flask.url_for(".get_snap_builds", snap_name=snap_name)
    )
