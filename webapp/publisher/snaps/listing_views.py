# Standard library
from json import loads

# Packages
import bleach
import flask
from canonicalwebteam.exceptions import (
    StoreApiError,
    StoreApiResponseErrorList,
)
from canonicalwebteam.store_api.dashboard import Dashboard
from canonicalwebteam.store_api.devicegw import DeviceGW

# Local
from webapp import helpers
from webapp.helpers import api_session
from webapp.decorators import login_required
from webapp.markdown import parse_markdown_description
from webapp.publisher.snaps import logic, preview_data
from webapp.store.logic import (
    filter_screenshots,
    get_categories,
    get_video,
)

dashboard = Dashboard(api_session)
device_gateway = DeviceGW("snap", api_session)


def get_market_snap(snap_name):
    return flask.redirect(
        flask.url_for(".get_listing_data", snap_name=snap_name)
    )


def redirect_post_market_snap(snap_name):
    return flask.redirect(
        flask.url_for(".post_listing_data", snap_name=snap_name)
    )


@login_required
def get_listing_data(snap_name):
    snap_details = dashboard.get_snap_info(flask.session, snap_name)

    details_metrics_enabled = snap_details["public_metrics_enabled"]
    details_blacklist = snap_details.get("public_metrics_blacklist", [])

    # Filter icon & screenshot urls from the media set.
    icon_urls, screenshot_urls, banner_urls = logic.categorise_media(
        snap_details["media"]
    )

    primary_website = ""
    if (
        "website" in snap_details["links"]
        and len(snap_details["links"]["website"]) > 0
    ):
        primary_website = snap_details["links"]["website"][0]

    websites = []
    if "website" in snap_details["links"]:
        if len(snap_details["links"]["website"]) > 1:
            snap_details["links"]["website"].pop(0)
            for website in snap_details["links"]["website"]:
                websites.append({"url": website})

    def format_links(key):
        result = []
        if key in snap_details["links"]:
            for url in snap_details["links"][key]:
                result.append({"url": url})
        return result

    licenses = []
    for license in helpers.get_licenses():
        licenses.append({"key": license["licenseId"], "name": license["name"]})

    license = snap_details["license"]
    license_type = "custom"

    if " AND " not in license.upper() and " WITH " not in license.upper():
        license_type = "simple"

    try:
        categories_results = device_gateway.get_categories()
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

    filename = "publisher/content/listing_tour.yaml"
    tour_steps = helpers.get_yaml(filename, typ="rt")

    primary_category = ""
    if len(snap_categories["categories"]) > 0:
        primary_category = snap_categories["categories"][0]

    secondary_category = ""
    if len(snap_categories["categories"]) > 1:
        secondary_category = snap_categories["categories"][1]

    video_urls = None

    if len(snap_details["video_urls"]) > 0:
        video_urls = snap_details["video_urls"][0]

    context = {
        "title": snap_details["title"],
        "video_urls": video_urls,
        "summary": snap_details["summary"],
        "description": snap_details["description"],
        "categories": categories,
        "primary_category": primary_category,
        "secondary_category": secondary_category,
        "websites": websites,
        "contacts": format_links("contact"),
        "donations": format_links("donations"),
        "source_code": format_links("source"),
        "issues": format_links("issues"),
        "primary_website": primary_website,
        "snap_id": snap_details["snap_id"],
        "public_metrics_enabled": details_metrics_enabled,
        "public_metrics_blacklist": details_blacklist,
        "license": license,
        "license_type": license_type,
        "licenses": licenses,
        "icon_url": icon_urls[0] if icon_urls else None,
        "screenshot_urls": screenshot_urls,
        "banner_urls": banner_urls,
        "update_metadata_on_release": snap_details[
            "update_metadata_on_release"
        ],
        "tour_steps": tour_steps,
    }

    res = {}
    res["data"] = context
    res["message"] = ""
    res["success"] = True

    return flask.jsonify(res)


@login_required
def get_listing_snap(snap_name):
    snap_details = dashboard.get_snap_info(flask.session, snap_name)
    token = ""
    if snap_details["links"]["website"]:
        token = helpers.get_dns_verification_token(
            snap_details["snap_name"], snap_details["links"]["website"][0]
        )
    return flask.render_template(
        "store/publisher.html",
        snap_name=snap_name,
        dns_verification_token=token,
    )


@login_required
def post_listing_data(snap_name):
    changes = None
    changed_fields = flask.request.form.get("changes")

    if changed_fields:
        changes = loads(changed_fields)

    if changes:
        snap_id = flask.request.form.get("snap_id")
        error_list = []

        if "images" in changes:
            # Add existing screenshots
            current_screenshots = dashboard.snap_screenshots(
                flask.session, snap_id
            )

            icon_input = (
                flask.request.files.get("icon")
                if flask.request.files.get("icon")
                else None
            )
            screenshots_input = [
                s if s else None
                for s in flask.request.files.getlist("screenshots")
            ]
            banner_image_input = (
                flask.request.files.get("banner-image")
                if flask.request.files.get("banner-image")
                else None
            )

            images_json, images_files = logic.build_changed_images(
                changes["images"],
                current_screenshots,
                icon_input,
                screenshots_input,
                banner_image_input,
            )

            try:
                dashboard.snap_screenshots(
                    flask.session, snap_id, images_json, images_files
                )
            except StoreApiResponseErrorList as api_response_error_list:
                if api_response_error_list.status_code != 404:
                    error_list = error_list + api_response_error_list.errors

        body_json = logic.filter_changes_data(changes)

        if body_json:
            if "description" in body_json:
                body_json["description"] = logic.remove_invalid_characters(
                    body_json["description"]
                )

            try:
                dashboard.snap_metadata(flask.session, snap_id, body_json)
            except StoreApiResponseErrorList as api_response_error_list:
                if api_response_error_list.status_code != 404:
                    error_list = error_list + api_response_error_list.errors

        if error_list:
            try:
                snap_details = dashboard.get_snap_info(
                    flask.session, snap_name
                )
            except StoreApiResponseErrorList as api_response_error_list:
                if api_response_error_list.status_code == 404:
                    return flask.abort(
                        404, "No snap named {}".format(snap_name)
                    )
                else:
                    error_list = error_list + api_response_error_list.errors

            licenses = []
            for license in helpers.get_licenses():
                licenses.append(
                    {"key": license["licenseId"], "name": license["name"]}
                )

            license = snap_details["license"]

            snap_categories = logic.replace_reserved_categories_key(
                snap_details["categories"]
            )

            snap_categories = logic.filter_categories(snap_categories)

            res = {"success", True}

            return flask.make_response(res, 200)

    return flask.make_response({}, 200)


@login_required
def post_preview(snap_name):
    snap_details = dashboard.get_snap_info(flask.session, snap_name)

    context = {
        "publisher": snap_details["publisher"]["display-name"],
        "username": snap_details["publisher"]["username"],
        "developer_validation": snap_details["publisher"]["validation"],
        "categories": [],
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
    context["appliances"] = []

    # Images
    icon = helpers.get_icon(context["images"])
    context["screenshots"] = filter_screenshots(context["images"])
    context["icon_url"] = icon
    context["video"] = get_video(context["images"])

    # Channel map
    context["channel_map"] = []
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
