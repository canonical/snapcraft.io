import flask
from flask import Response
import requests

import logging
import humanize
import os

import webapp.helpers as helpers
import webapp.metrics.helper as metrics_helper
import webapp.metrics.metrics as metrics
import webapp.store.logic as logic
from webapp import authentication
from webapp.markdown import parse_markdown_description
from cache.cache_utility import redis_cache

from canonicalwebteam.flask_base.decorators import (
    exclude_xframe_options_header,
)
from canonicalwebteam.exceptions import StoreApiError
from canonicalwebteam.store_api.devicegw import DeviceGW
from pybadges import badge

device_gateway = DeviceGW("snap", helpers.api_session)
device_gateway_sbom = DeviceGW("sbom", helpers.api_session)

logger = logging.getLogger(__name__)


FIELDS = [
    "title",
    "summary",
    "description",
    "license",
    "contact",
    "website",
    "publisher",
    "media",
    "download",
    "version",
    "created-at",
    "confinement",
    "categories",
    "trending",
    "unlisted",
    "links",
    "revision",
]

FIELDS_EXTRA_DETAILS = [
    "aliases",
]


def snap_details_views(store):
    snap_regex = "[a-z0-9-]*[a-z][a-z0-9-]*"
    snap_regex_upercase = "[A-Za-z0-9-]*[A-Za-z][A-Za-z0-9-]*"

    def _get_context_snap_details(snap_name, supported_architectures=None):
        details = device_gateway.get_item_details(
            snap_name, fields=FIELDS, api_version=2
        )
        # 404 for any snap under quarantine
        if details["snap"]["publisher"]["username"] == "snap-quarantine":
            flask.abort(404, "No snap named {}".format(snap_name))

        # When removing all the channel maps of an existing snap the API,
        # responds that the snaps still exists with data.
        # Return a 404 if not channel maps, to avoid having a error.
        # For example: mir-kiosk-browser
        if not details.get("channel-map"):
            flask.abort(404, "No snap named {}".format(snap_name))

        formatted_description = parse_markdown_description(
            details.get("snap", {}).get("description", "")
        )

        channel_maps_list = logic.convert_channel_maps(
            details.get("channel-map")
        )

        latest_channel = logic.get_last_updated_version(
            details.get("channel-map")
        )

        revisions = logic.get_revisions(details.get("channel-map"))

        default_track = (
            details.get("default-track")
            if details.get("default-track")
            else "latest"
        )

        lowest_risk_available = logic.get_lowest_available_risk(
            channel_maps_list, default_track
        )

        extracted_info = logic.extract_info_channel_map(
            channel_maps_list, default_track, lowest_risk_available
        )

        last_updated = latest_channel["channel"]["released-at"]
        updates = logic.get_latest_versions(
            details.get("channel-map"),
            default_track,
            lowest_risk_available,
            supported_architectures,
        )

        # Determine the most recent update date from updates tuple
        # updates[0] is the stable channel, updates[1] is the most
        # recent non-stable
        most_recent_update = None
        if updates[0] and updates[1]:
            # Compare both and use the most recent
            date_0 = updates[0].get("released-at")
            date_1 = updates[1].get("released-at")
            if date_0 and date_1:
                most_recent_update = max(date_0, date_1)
            else:
                most_recent_update = date_0 or date_1
        elif updates[0]:
            most_recent_update = updates[0].get("released-at")
        elif updates[1]:
            most_recent_update = updates[1].get("released-at")

        binary_filesize = latest_channel["download"]["size"]

        # filter out banner and banner-icon images from screenshots
        screenshots = logic.filter_screenshots(
            details.get("snap", {}).get("media", [])
        )

        icon_url = helpers.get_icon(details.get("snap", {}).get("media", []))

        publisher_info = helpers.get_yaml(
            "{}{}.yaml".format(
                flask.current_app.config["CONTENT_DIRECTORY"][
                    "PUBLISHER_PAGES"
                ],
                details["snap"]["publisher"]["username"],
            ),
            typ="safe",
        )

        publisher_snaps = helpers.get_yaml(
            "{}{}-snaps.yaml".format(
                flask.current_app.config["CONTENT_DIRECTORY"][
                    "PUBLISHER_PAGES"
                ],
                details["snap"]["publisher"]["username"],
            ),
            typ="safe",
        )

        publisher_featured_snaps = None

        if publisher_info:
            publisher_featured_snaps = publisher_info.get("featured_snaps")
            publisher_snaps = logic.get_n_random_snaps(
                publisher_snaps["snaps"], 4
            )

        video = logic.get_video(details.get("snap", {}).get("media", []))

        is_users_snap = False
        if authentication.is_authenticated(flask.session):
            if (
                flask.session.get("publisher").get("nickname")
                == details["snap"]["publisher"]["username"]
            ):
                is_users_snap = True

        # build list of categories of a snap
        categories = logic.get_snap_categories(
            details.get("snap", {}).get("categories", [])
        )

        developer = logic.get_snap_developer(details["name"])

        is_last_updated_old = logic.is_snap_old(last_updated)

        context = {
            "snap_id": details.get("snap-id"),
            # Data direct from details API
            "snap_title": details["snap"]["title"],
            "package_name": details["name"],
            "categories": categories,
            "icon_url": icon_url,
            "version": extracted_info["version"],
            "license": details["snap"]["license"],
            "publisher": details["snap"]["publisher"]["display-name"],
            "username": details["snap"]["publisher"]["username"],
            "screenshots": screenshots,
            "video": video,
            "publisher_snaps": publisher_snaps,
            "publisher_featured_snaps": publisher_featured_snaps,
            "has_publisher_page": publisher_info is not None,
            "contact": details["snap"].get("contact"),
            "website": details["snap"].get("website"),
            "summary": details["snap"]["summary"],
            "description": formatted_description,
            "channel_map": channel_maps_list,
            "has_stable": logic.has_stable(channel_maps_list),
            "developer_validation": details["snap"]["publisher"]["validation"],
            "default_track": default_track,
            "lowest_risk_available": lowest_risk_available,
            "confinement": extracted_info["confinement"],
            "trending": details.get("snap", {}).get("trending", False),
            # Transformed API data
            "filesize": humanize.naturalsize(binary_filesize),
            "last_updated": logic.convert_date(last_updated),
            "last_updated_raw": last_updated,
            "is_snap_old": logic.is_snap_old(most_recent_update),
            "is_last_updated_old": is_last_updated_old,
            "is_users_snap": is_users_snap,
            "unlisted": details.get("snap", {}).get("unlisted", False),
            "developer": developer,
            # TODO: This is horrible and hacky
            "appliances": {
                "adguard-home": "adguard",
                "mosquitto": "mosquitto",
                "nextcloud": "nextcloud",
                "plexmediaserver": "plex",
                "openhab": "openhab",
            },
            "links": details["snap"].get("links"),
            "updates": updates,
            "revisions": revisions,
        }
        return context

    def snap_has_sboms(revisions, snap_id):
        if not revisions:
            return False

        sbom_path = f"download/sbom_snap_{snap_id}_{revisions[0]}.spdx2.3.json"
        endpoint = device_gateway_sbom.get_endpoint_url(sbom_path)

        res = requests.head(endpoint)

        # backend returns 302 instead of 200 for a successful request
        # adding the check for 200 in case this is changed without us knowing
        if res.status_code == 200 or res.status_code == 302:
            return True

        return False

    @store.route("/download/sbom_snap_<snap_id>_<revision>.spdx2.3.json")
    def get_sbom(snap_id, revision):
        sbom_path = f"download/sbom_snap_{snap_id}_{revision}.spdx2.3.json"
        endpoint = device_gateway_sbom.get_endpoint_url(sbom_path)

        res = requests.get(endpoint)

        return flask.jsonify(res.json())

    @store.route('/<regex("' + snap_regex + '"):snap_name>')
    def snap_details(snap_name):
        """
        A view to display the snap details page for specific snaps.

        This queries the snapcraft API (api.snapcraft.io) and passes
        some of the data through to the snap-details.html template,
        with appropriate sanitation.
        """

        error_info = {}
        status_code = 200

        context = _get_context_snap_details(snap_name)
        try:
            # the empty string channel makes the store API not filter by
            # the default channel 'latest/stable', which gives errors for
            # snaps that don't use that channel
            extra_details = device_gateway.get_snap_details(
                snap_name, channel="", fields=FIELDS_EXTRA_DETAILS
            )
        except Exception:
            logger.exception("Details endpoint returned an error")
            extra_details = None

        if extra_details and extra_details["aliases"]:
            context["aliases"] = [
                [
                    f"{extra_details['package_name']}.{alias_obj['target']}",
                    alias_obj["name"],
                ]
                for alias_obj in extra_details["aliases"]
            ]

        country_metric_name = "weekly_installed_base_by_country_percent"
        os_metric_name = "weekly_installed_base_by_operating_system_normalized"

        end = metrics_helper.get_last_metrics_processed_date()

        metrics_query_json = [
            metrics_helper.get_filter(
                metric_name=country_metric_name,
                snap_id=context["snap_id"],
                start=end,
                end=end,
            ),
            metrics_helper.get_filter(
                metric_name=os_metric_name,
                snap_id=context["snap_id"],
                start=end,
                end=end,
            ),
        ]

        metrics_response = device_gateway.get_public_metrics(
            metrics_query_json
        )

        os_metrics = None
        country_devices = None
        if metrics_response:
            oses = metrics_helper.find_metric(metrics_response, os_metric_name)
            os_metrics = metrics.OsMetric(
                name=oses["metric_name"],
                series=oses["series"],
                buckets=oses["buckets"],
                status=oses["status"],
            )

            territories = metrics_helper.find_metric(
                metrics_response, country_metric_name
            )
            country_devices = metrics.CountryDevices(
                name=territories["metric_name"],
                series=territories["series"],
                buckets=territories["buckets"],
                status=territories["status"],
                private=False,
            )

        has_sboms = snap_has_sboms(context["revisions"], context["snap_id"])

        context.update(
            {
                "countries": (
                    country_devices.country_data if country_devices else None
                ),
                "normalized_os": os_metrics.os if os_metrics else None,
                # Context info
                "is_linux": (
                    "Linux" in flask.request.headers.get("User-Agent", "")
                    and "Android"
                    not in flask.request.headers.get("User-Agent", "")
                ),
                "error_info": error_info,
            }
        )

        context["has_sboms"] = has_sboms

        return (
            flask.render_template("store/snap-details.html", **context),
            status_code,
        )

    @store.route('/<regex("' + snap_regex + '"):snap_name>/embedded')
    @exclude_xframe_options_header
    def snap_details_embedded(snap_name):
        """
        A view to display the snap embedded card for specific snaps.

        This queries the snapcraft API (api.snapcraft.io) and passes
        some of the data through to the template,
        with appropriate sanitation.
        """
        status_code = 200

        context = _get_context_snap_details(snap_name)

        button_variants = ["black", "white"]
        button = flask.request.args.get("button")
        if button and button not in button_variants:
            button = "black"

        architectures = list(context["channel_map"].keys())

        context.update(
            {
                "default_architecture": (
                    "amd64" if "amd64" in architectures else architectures[0]
                ),
                "button": button,
                "show_channels": flask.request.args.get("channels"),
                "show_summary": flask.request.args.get("summary"),
                "show_screenshot": flask.request.args.get("screenshot"),
            }
        )

        return (
            flask.render_template("store/snap-embedded-card.html", **context),
            status_code,
        )

    @store.route('/<regex("' + snap_regex_upercase + '"):snap_name>')
    def snap_details_case_sensitive(snap_name):
        return flask.redirect(
            flask.url_for(".snap_details", snap_name=snap_name.lower())
        )

    def get_badge_svg(snap_name, left_text, right_text, color="#0e8420"):
        show_name = flask.request.args.get("name", default=1, type=int)
        snap_link = flask.request.url_root + snap_name

        svg = badge(
            left_text=left_text if show_name else "",
            right_text=right_text,
            right_color=color,
            left_link=snap_link,
            right_link=snap_link,
            logo=(
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' "
                "viewBox='0 0 32 32'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:%23f"
                "ff%7D%3C/style%3E%3C/defs%3E%3Cpath class='cls-1' d='M18.03 1"
                "8.03l5.95-5.95-5.95-2.65v8.6zM6.66 29.4l10.51-10.51-3.21-3.18"
                "-7.3 13.69zM2.5 3.6l15.02 14.94V9.03L2.5 3.6zM27.03 9.03h-8.6"
                "5l11.12 4.95-2.47-4.95z'/%3E%3C/svg%3E"
            ),
        )
        return svg

    @store.route('/<regex("' + snap_regex + '"):snap_name>/badge.svg')
    def snap_details_badge(snap_name):
        context = _get_context_snap_details(snap_name)

        # channel with safest risk available in default track
        snap_channel = "".join(
            [context["default_track"], "/", context["lowest_risk_available"]]
        )

        svg = get_badge_svg(
            snap_name=snap_name,
            left_text=context["snap_title"],
            right_text=snap_channel + " " + context["version"],
        )

        return svg, 200, {"Content-Type": "image/svg+xml"}

    @store.route("/<lang>/<theme>/install.svg")
    def snap_install_badge(lang, theme):
        base_path = "static/images/badges/"
        allowed_langs = helpers.list_folders(base_path)

        if lang not in allowed_langs:
            return Response("Invalid language", status=400)

        file_name = (
            "snap-store-white.svg"
            if theme == "light"
            else "snap-store-black.svg"
        )

        svg_path = os.path.normpath(os.path.join(base_path, lang, file_name))

        # Ensure the path is within the base path
        if not svg_path.startswith(base_path) or not os.path.exists(svg_path):
            return Response(
                '<svg height="20" width="1" '
                'xmlns="http://www.w3.org/2000/svg" '
                'xmlns:xlink="http://www.w3.org/1999/xlink"></svg>',
                mimetype="image/svg+xml",
                status=404,
            )
        else:
            with open(svg_path, "r") as svg_file:
                svg_content = svg_file.read()
            return Response(svg_content, mimetype="image/svg+xml")

    @store.route('/<regex("' + snap_regex + '"):snap_name>/trending.svg')
    def snap_details_badge_trending(snap_name):
        is_preview = flask.request.args.get("preview", default=0, type=int)
        context = _get_context_snap_details(snap_name)

        # default to empty SVG
        svg = (
            '<svg height="20" width="1" xmlns="http://www.w3.org/2000/svg" '
            'xmlns:xlink="http://www.w3.org/1999/xlink"></svg>'
        )

        # publishers can see preview of trending badge of their own snaps
        # on Publicise page
        show_as_preview = False
        if is_preview and authentication.is_authenticated(flask.session):
            show_as_preview = True

        if context["trending"] or show_as_preview:
            svg = get_badge_svg(
                snap_name=snap_name,
                left_text=context["snap_title"],
                right_text="Trending this week",
                color="#FA7041",
            )

        return svg, 200, {"Content-Type": "image/svg+xml"}

    @store.route('/install/<regex("' + snap_regex + '"):snap_name>/<distro>')
    def snap_distro_install(snap_name, distro):
        filename = f"store/content/distros/{distro}.yaml"
        distro_data = helpers.get_yaml(filename)

        if not distro_data:
            flask.abort(404)

        supported_archs = distro_data["supported-archs"]
        context = _get_context_snap_details(snap_name, supported_archs)

        if all(arch not in context["channel_map"] for arch in supported_archs):
            return flask.render_template("404.html"), 404

        context.update(
            {
                "distro": distro,
                "distro_name": distro_data["name"],
                "distro_logo": distro_data["logo"],
                "distro_logo_mono": distro_data["logo-mono"],
                "distro_color_1": distro_data["color-1"],
                "distro_color_2": distro_data["color-2"],
                "distro_install_steps": distro_data["install"],
            }
        )
        cached_featured_snaps = redis_cache.get(
            "featured_snaps_install_pages", expected_type=list
        )
        if cached_featured_snaps:
            context.update({"featured_snaps": cached_featured_snaps})
            return flask.render_template(
                "store/snap-distro-install.html", **context
            )
        try:
            featured_snaps_results = device_gateway.get_featured_items(
                size=13, page=1
            ).get("results", [])

        except StoreApiError:
            featured_snaps_results = []
        featured_snaps = [
            snap
            for snap in featured_snaps_results
            if snap["package_name"] != snap_name
        ][:12]

        for snap in featured_snaps:
            snap["icon_url"] = helpers.get_icon(snap["media"])
        redis_cache.set(
            "featured_snaps_install_pages", featured_snaps, ttl=3600
        )
        context.update({"featured_snaps": featured_snaps})
        return flask.render_template(
            "store/snap-distro-install.html", **context
        )

    @store.route("/report", methods=["POST"])
    def report_snap():
        form_url = flask.current_app.config.get("REPORT_SHEET_URL")
        if not form_url:
            logger.warning("REPORT_SHEET_URL is not configured")
            return flask.jsonify({"error": "report_url_missing"}), 503

        fields = flask.request.form

        # If the honeypot is activated (hidden field populated
        # silently reject to avoid spam
        if "confirm" in fields:
            return flask.jsonify({"ok": True}), 200
        payload = {
            "snap_name": fields.get("snap_name", ""),
            "reason": fields.get("reason", ""),
            "comment": fields.get("comment", ""),
            "email": fields.get("email", ""),
        }

        try:
            response = requests.post(form_url, data=payload)
            if not response.ok:
                logger.warning(
                    "Report sheet webhook returned %s",
                    response.status_code,
                )
                return flask.jsonify({"error": "report_failed"}), 502
        except requests.RequestException:
            logger.exception("Report sheet webhook request failed")
            return flask.jsonify({"error": "report_failed"}), 502

        return flask.jsonify({"ok": True}), 200
