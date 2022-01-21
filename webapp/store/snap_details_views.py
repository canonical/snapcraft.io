import flask
import humanize

import webapp.helpers as helpers
import webapp.metrics.helper as metrics_helper
import webapp.metrics.metrics as metrics
import webapp.store.logic as logic
from webapp import authentication
from webapp.api.exceptions import ApiError
from webapp.markdown import parse_markdown_description

from canonicalwebteam.flask_base.decorators import (
    exclude_xframe_options_header,
)
from canonicalwebteam.store_api.exceptions import (
    StoreApiError,
    StoreApiResponseDecodeError,
    StoreApiResponseError,
    StoreApiResponseErrorList,
    StoreApiTimeoutError,
)
from pybadges import badge


def snap_details_views(store, api, handle_errors):

    snap_regex = "[a-z0-9-]*[a-z][a-z0-9-]*"
    snap_regex_upercase = "[A-Za-z0-9-]*[A-Za-z][A-Za-z0-9-]*"

    def _get_context_snap_details(snap_name):
        try:
            details = api.get_item_details(snap_name, api_version=2)
        except StoreApiTimeoutError as api_timeout_error:
            flask.abort(504, str(api_timeout_error))
        except StoreApiResponseDecodeError as api_response_decode_error:
            flask.abort(502, str(api_response_decode_error))
        except StoreApiResponseErrorList as api_response_error_list:
            if api_response_error_list.status_code == 404:
                flask.abort(404, "No snap named {}".format(snap_name))
            else:
                if api_response_error_list.errors:
                    error_messages = ", ".join(
                        api_response_error_list.errors.key()
                    )
                else:
                    error_messages = "An error occurred."
                flask.abort(502, error_messages)
        except StoreApiResponseError as api_response_error:
            flask.abort(502, str(api_response_error))
        except (StoreApiError, ApiError) as api_error:
            flask.abort(502, str(api_error))

        # When removing all the channel maps of an existing snap the API,
        # responds that the snaps still exists with data.
        # Return a 404 if not channel maps, to avoid having a error.
        # For example: mir-kiosk-browser
        if not details.get("channel-map"):
            flask.abort(404, "No snap named {}".format(snap_name))

        formatted_description = parse_markdown_description(
            details["snap"]["description"]
        )

        channel_maps_list = logic.convert_channel_maps(
            details.get("channel-map")
        )

        latest_channel = logic.get_last_updated_version(
            details.get("channel-map")
        )

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
        binary_filesize = latest_channel["download"]["size"]

        # filter out banner and banner-icon images from screenshots
        screenshots = logic.filter_screenshots(details["snap"]["media"])

        icons = logic.get_icon(details["snap"]["media"])

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

        video = logic.get_video(details["snap"]["media"])

        is_users_snap = False
        if authentication.is_authenticated(flask.session):
            if (
                flask.session.get("publisher").get("nickname")
                == details["snap"]["publisher"]["username"]
            ) or (
                "user_shared_snaps" in flask.session
                and snap_name in flask.session.get("user_shared_snaps")
            ):
                is_users_snap = True

        # build list of categories of a snap
        categories = logic.get_snap_categories(details["snap"]["categories"])

        developer = logic.get_snap_developer(details["name"])

        context = {
            "snap-id": details.get("snap-id"),
            # Data direct from details API
            "snap_title": details["snap"]["title"],
            "package_name": details["name"],
            "categories": categories,
            "icon_url": icons[0] if icons else None,
            "version": extracted_info["version"],
            "license": details["snap"]["license"],
            "publisher": details["snap"]["publisher"]["display-name"],
            "username": details["snap"]["publisher"]["username"],
            "screenshots": screenshots,
            "video": video,
            "publisher_snaps": publisher_snaps,
            "publisher_featured_snaps": publisher_featured_snaps,
            "has_publisher_page": publisher_info is not None,
            "prices": details["snap"]["prices"],
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
            "trending": details["snap"]["trending"],
            # Transformed API data
            "filesize": humanize.naturalsize(binary_filesize),
            "last_updated": logic.convert_date(last_updated),
            "last_updated_raw": last_updated,
            "is_users_snap": is_users_snap,
            "unlisted": details["snap"]["unlisted"],
            "developer": developer,
            # TODO: This is horrible and hacky
            "appliances": {
                "adguard-home": "adguard",
                "mosquitto": "mosquitto",
                "nextcloud": "nextcloud",
                "plexmediaserver": "plex",
                "openhab": "openhab",
            },
        }

        return context

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

        webapp_config = flask.current_app.config.get("WEBAPP_CONFIG")

        if "STORE_QUERY" not in webapp_config:
            country_metric_name = "weekly_installed_base_by_country_percent"
            os_metric_name = (
                "weekly_installed_base_by_operating_system_normalized"
            )

            end = metrics_helper.get_last_metrics_processed_date()

            metrics_query_json = [
                metrics_helper.get_filter(
                    metric_name=country_metric_name,
                    snap_id=context["snap-id"],
                    start=end,
                    end=end,
                ),
                metrics_helper.get_filter(
                    metric_name=os_metric_name,
                    snap_id=context["snap-id"],
                    start=end,
                    end=end,
                ),
            ]

            try:
                metrics_response = api.get_public_metrics(metrics_query_json)
            except (StoreApiError, ApiError) as api_error:
                status_code, error_info = handle_errors(api_error)
                metrics_response = None

            os_metrics = None
            country_devices = None
            if metrics_response:
                oses = metrics_helper.find_metric(
                    metrics_response, os_metric_name
                )
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
        else:
            os_metrics = None
            country_devices = None

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
            if (
                flask.session.get("publisher").get("nickname")
                == context["username"]
            ) or (
                "user_shared_snaps" in flask.session
                and snap_name in flask.session.get("user_shared_snaps")
            ):
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

        context = _get_context_snap_details(snap_name)

        if distro == "raspbian":
            if (
                "armhf" not in context["channel_map"]
                and "arm64" not in context["channel_map"]
            ):
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

        try:
            featured_snaps_results = api.get_featured_items(
                size=13, page=1
            ).get("results", [])
        except StoreApiError:
            featured_snaps_results = []

        featured_snaps = [
            snap
            for snap in featured_snaps_results
            if snap["package_name"] != snap_name
        ][:12]

        context.update({"featured_snaps": featured_snaps})
        return flask.render_template(
            "store/snap-distro-install.html", **context
        )
