# Standard library
from json import loads

# Packages
import flask
import webapp.metrics.helper as metrics_helper
import webapp.metrics.metrics as metrics

# Local
from webapp import helpers
from webapp.api import dashboard as api
from webapp.api.exceptions import ApiError, ApiResponseErrorList
from webapp.decorators import login_required
from webapp.publisher.snaps import logic
from webapp.publisher.views import _handle_error, _handle_error_list


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


@login_required
def get_measure_snap(snap_name):
    return flask.redirect(
        flask.url_for(".publisher_snap_metrics", snap_name=snap_name)
    )


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

    series = active_metrics["series"]

    if installed_base_metric == "os":
        capitalized_series = active_metrics["series"]
        for item in capitalized_series:
            item["name"] = metrics._capitalize_os_name(item["name"])
        series = capitalized_series

    active_devices = metrics.ActiveDevices(
        name=active_metrics["metric_name"],
        series=series,
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
