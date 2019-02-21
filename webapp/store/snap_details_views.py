import flask

import bleach
import humanize
import webapp.helpers as helpers
import webapp.metrics.helper as metrics_helper
import webapp.metrics.metrics as metrics
import webapp.store.logic as logic
from webapp.api.exceptions import (
    ApiCircuitBreaker,
    ApiConnectionError,
    ApiError,
    ApiResponseDecodeError,
    ApiResponseError,
    ApiResponseErrorList,
    ApiTimeoutError,
)
from webapp.markdown import parse_markdown_description


def snap_details_views(store, api):
    def _handle_errors(api_error: ApiError):
        status_code = 502
        error = {"message": str(api_error)}

        if type(api_error) is ApiTimeoutError:
            status_code = 504
        elif type(api_error) is ApiResponseDecodeError:
            status_code = 502
        elif type(api_error) is ApiResponseErrorList:
            error["errors"] = api_error.errors
            status_code = 502
        elif type(api_error) is ApiResponseError:
            status_code = 502
        elif type(api_error) is ApiConnectionError:
            status_code = 502
        elif type(api_error) is ApiCircuitBreaker:
            # Special case for this one, because it is the only case where we
            # don't want the user to be able to access the page.
            return flask.abort(503)

        return status_code, error

    def _get_context_snap_details(snap_name):
        try:
            details = api.get_snap_details(snap_name)
        except ApiTimeoutError as api_timeout_error:
            flask.abort(504, str(api_timeout_error))
        except ApiResponseDecodeError as api_response_decode_error:
            flask.abort(502, str(api_response_decode_error))
        except ApiResponseErrorList as api_response_error_list:
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
        except ApiResponseError as api_response_error:
            flask.abort(502, str(api_response_error))
        except ApiCircuitBreaker:
            flask.abort(503)
        except ApiError as api_error:
            flask.abort(502, str(api_error))

        # When removing all the channel maps of an exsting snap the API,
        # responds that the snaps still exists with data.
        # Return a 404 if not channel maps, to avoid having a error.
        # For example: mir-kiosk-browser
        if not details.get("channel-map"):
            flask.abort(404, "No snap named {}".format(snap_name))

        clean_description = bleach.clean(details["snap"]["description"])
        formatted_description = parse_markdown_description(clean_description)

        channel_maps_list = logic.convert_channel_maps(
            details.get("channel-map")
        )

        latest_channel = logic.get_last_updated_version(
            details.get("channel-map")
        )

        last_updated = latest_channel["created-at"]
        last_version = latest_channel["version"]
        binary_filesize = latest_channel["download"]["size"]

        # filter out banner and banner-icon images from screenshots
        screenshots = logic.filter_screenshots(details["snap"]["media"])

        icons = logic.get_icon(details["snap"]["media"])

        videos = logic.get_videos(details["snap"]["media"])

        # until default tracks are supported by the API we special case node
        # to use 10, rather then latest
        default_track = helpers.get_default_track(details["name"])

        lowest_risk_available = logic.get_lowest_available_risk(
            channel_maps_list, default_track
        )

        confinement = logic.get_confinement(
            channel_maps_list, default_track, lowest_risk_available
        )

        last_version = logic.get_version(
            channel_maps_list, default_track, lowest_risk_available
        )

        is_users_snap = False
        if flask.session and "openid" in flask.session:
            if (
                flask.session.get("openid").get("nickname")
                == details["snap"]["publisher"]["username"]
            ):
                is_users_snap = True

        # build list of categories of a snap
        categories = logic.get_snap_categories(details["snap"]["categories"])

        context = {
            "snap-id": details.get("snap-id"),
            # Data direct from details API
            "snap_title": details["snap"]["title"],
            "package_name": details["name"],
            "categories": categories,
            "icon_url": icons[0] if icons else None,
            "version": last_version,
            "license": details["snap"]["license"],
            "publisher": details["snap"]["publisher"]["display-name"],
            "username": details["snap"]["publisher"]["username"],
            "screenshots": screenshots,
            "videos": videos,
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
            "confinement": confinement,
            # Transformed API data
            "filesize": humanize.naturalsize(binary_filesize),
            "last_updated": logic.convert_date(last_updated),
            "last_updated_raw": last_updated,
            "is_users_snap": is_users_snap,
        }

        return context

    @store.route('/<regex("[a-z0-9-]*[a-z][a-z0-9-]*"):snap_name>')
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
                metrics_response = api.get_public_metrics(
                    snap_name, metrics_query_json
                )
            except ApiError as api_error:
                status_code, error_info = _handle_errors(api_error)
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

    @store.route('/<regex("[a-z0-9-]*[a-z][a-z0-9-]*"):snap_name>/embedded')
    def snap_details_embedded(snap_name):
        """
        A view to display the snap embedded card for specific snaps.

        This queries the snapcraft API (api.snapcraft.io) and passes
        some of the data through to the template,
        with appropriate sanitation.
        """
        status_code = 200

        context = _get_context_snap_details(snap_name)

        context.update(
            {
                "is_linux": (
                    "Linux" in flask.request.headers.get("User-Agent", "")
                    and "Android"
                    not in flask.request.headers.get("User-Agent", "")
                )
            }
        )

        return (
            flask.render_template("store/snap-embedded-card.html", **context),
            status_code,
        )

    @store.route('/<regex("[A-Za-z0-9-]*[A-Za-z][A-Za-z0-9-]*"):snap_name>')
    def snap_details_case_sensitive(snap_name):
        return flask.redirect(
            flask.url_for(".snap_details", snap_name=snap_name.lower())
        )
