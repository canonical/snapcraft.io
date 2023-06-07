# Standard library
from json import loads

# Packages
import bleach
import flask
from flask import json
from canonicalwebteam.store_api.stores.snapstore import (
    SnapPublisher,
    SnapStore,
)
from canonicalwebteam.store_api.exceptions import (
    StoreApiError,
    StoreApiResponseErrorList,
)

# Local
from webapp import helpers
from webapp.helpers import api_publisher_session
from webapp.decorators import login_required
from webapp.markdown import parse_markdown_description
from webapp.publisher.snaps import logic, preview_data
from webapp.store.logic import (
    filter_screenshots,
    get_categories,
    get_video,
)

store_api = SnapStore(api_publisher_session)
publisher_api = SnapPublisher(api_publisher_session)


def get_market_snap(snap_name):
    return flask.redirect(
        flask.url_for(".get_listing_snap", snap_name=snap_name)
    )


def redirect_post_market_snap(snap_name):
    return flask.redirect(
        flask.url_for(".post_listing_snap", snap_name=snap_name)
    )


@login_required
def get_listing_snap(snap_name):
    snap_details = publisher_api.get_snap_info(snap_name, flask.session)

    details_metrics_enabled = snap_details["public_metrics_enabled"]
    details_blacklist = snap_details.get("public_metrics_blacklist", [])

    is_on_stable = logic.is_snap_on_stable(snap_details["channel_maps_list"])

    # Filter icon & screenshot urls from the media set.
    icon_urls, screenshot_urls, banner_urls = logic.categorise_media(
        snap_details["media"]
    )

    licenses = []
    for license in helpers.get_licenses():
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

    filename = "publisher/content/listing_tour.yaml"
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
        "update_metadata_on_release": snap_details[
            "update_metadata_on_release"
        ],
        "links": {
            "contact": [],
            "donation": [],
            "issues": [],
            "source-code": [],
            "website": [],
        },
    }

    return flask.render_template(
        "publisher/listing.html", **context, listing_data=json.dumps(context)
    )


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
            current_screenshots = publisher_api.snap_screenshots(
                snap_id, flask.session
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
                publisher_api.snap_screenshots(
                    snap_id, flask.session, images_json, images_files
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
                publisher_api.snap_metadata(snap_id, flask.session, body_json)
            except StoreApiResponseErrorList as api_response_error_list:
                if api_response_error_list.status_code != 404:
                    error_list = error_list + api_response_error_list.errors

        if error_list:
            try:
                snap_details = publisher_api.get_snap_info(
                    snap_name, flask.session
                )
            except StoreApiResponseErrorList as api_response_error_list:
                if api_response_error_list.status_code == 404:
                    return flask.abort(
                        404, "No snap named {}".format(snap_name)
                    )
                else:
                    error_list = error_list + api_response_error_list.errors

            field_errors, other_errors = logic.invalid_field_errors(error_list)

            details_metrics_enabled = snap_details["public_metrics_enabled"]
            details_blacklist = snap_details.get(
                "public_metrics_blacklist", []
            )

            is_on_stable = logic.is_snap_on_stable(
                snap_details["channel_maps_list"]
            )

            # Filter icon & screenshot urls from the media set.
            icon_urls, screenshot_urls, banner_urls = logic.categorise_media(
                snap_details["media"]
            )

            licenses = []
            for license in helpers.get_licenses():
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

            filename = "publisher/content/listing_tour.yaml"
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

    return flask.redirect(
        flask.url_for(".get_listing_snap", snap_name=snap_name)
    )


@login_required
def post_preview(snap_name):
    snap_details = publisher_api.get_snap_info(snap_name, flask.session)

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
