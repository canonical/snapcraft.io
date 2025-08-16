# Standard library
from json import loads

# Packages
import bleach
import flask
from canonicalwebteam.store_api.dashboard import Dashboard

# Local
from webapp import helpers
from webapp.helpers import api_session
from webapp.decorators import login_required
from webapp.markdown import parse_markdown_description
from webapp.publisher.snaps import preview_data
from webapp.store.logic import (
    filter_screenshots,
    get_video,
)

dashboard = Dashboard(api_session)


def get_market_snap(snap_name):
    return flask.redirect(
        flask.url_for(".get_listing_data", snap_name=snap_name)
    )


def redirect_post_market_snap(snap_name):
    return flask.redirect(
        flask.url_for(".post_listing_data", snap_name=snap_name)
    )


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

    if context["video"]:
        context["video"] = get_video(context["video"])

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
