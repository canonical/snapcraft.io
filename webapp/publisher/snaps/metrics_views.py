# Standard library
from json import loads
from dateutil import relativedelta
import math

# Packages
import flask
import webapp.metrics.helper as metrics_helper
import webapp.metrics.metrics as metrics
from canonicalwebteam.store_api.stores.snapstore import (
    SnapPublisher,
    SnapStore,
)

# Local
from webapp.helpers import api_publisher_session
from webapp.decorators import login_required
from webapp.publisher.snaps import logic


publisher_api = SnapPublisher(api_publisher_session)
store_api = SnapStore(api_publisher_session)

downsample_data_limit = 500
downsample_target_size = 15
 

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
            snap_metrics = publisher_api.get_publisher_metrics(
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
    """
    context = {
        # Data direct from details API
        "snap_name": snap_name,
        # pass snap id from here?
        "is_linux": "Linux" in flask.request.headers["User-Agent"],
    }

    return flask.render_template("publisher/metrics.html", **context)

@login_required
def get_active_devices(snap_name):

    snap_details = store_api.get_item_details(
        snap_name, api_version=2, fields=["snap-id"]
    )

    snap_id = snap_details["snap-id"]

    installed_base_metric = logic.verify_base_metrics(
        flask.request.args.get("active-devices", default="version", type=str)
    )

    period = flask.request.args.get("period", default="30d", type=str)
    active_device_period = logic.extract_metrics_period(period)
    
    page = flask.request.args.get("page", default=1, type=int)

    metric_requested_length = active_device_period["int"]
    metric_requested_bucket = active_device_period["bucket"]

    page_time_length = flask.request.args.get("page-length", default=3, type=int)
    total_page_num = 1
    if metric_requested_bucket == "d" or (metric_requested_bucket == "m" and page_time_length >= metric_requested_length):
        dates = metrics_helper.get_dates_for_metric(metric_requested_length, metric_requested_bucket)
        start = dates['start']
        end = dates['end']
    else:
        page_period_length = (metric_requested_length * 12) if metric_requested_bucket == 'y' else metric_requested_length
        total_page_num = math.floor(page_period_length / page_time_length)

        end = metrics_helper.get_last_metrics_processed_date() + (relativedelta.relativedelta(months=-(page_time_length*(page -1))))
        start = end + (relativedelta.relativedelta(months=-(page_time_length)))

        # decrease a day to make sure there is no overlapping dates across the pages.
        if  page != 1:
            end = end + relativedelta.relativedelta(days=-1)

    installed_base = logic.get_installed_based_metric(installed_base_metric)

    new_metrics_query = metrics_helper.build_active_device_metric_query(
        snap_id=snap_id,
        installed_base=installed_base,
        end=end,
        start=start
    )
    
    metrics_response = publisher_api.get_publisher_metrics(
        flask.session, json=new_metrics_query
    )

    active_metrics = metrics_helper.find_metric(
        metrics_response["metrics"], installed_base
    )

   
    metrics_data = active_metrics
    buckets = metrics_data['buckets']
    series = metrics_data['series']
    metric_name = metrics_data['metric_name']
    # Add constants to a variable
    if len(series) > downsample_data_limit:
        downsampled_buckets, downsampled_series = metrics_helper.downsample_series(buckets, series, downsample_target_size)
    else:
        downsampled_buckets = buckets
        downsampled_series = series

    series = downsampled_series
    if metric_name == "weekly_installed_base_by_channel":
        for s in series:
            if "/" not in s["name"]:
                s["name"] = f"latest/{s['name']}"

    if installed_base_metric == "os":
        for item in series:
            item["name"] = metrics._capitalize_os_name(item["name"])

    active_devices = metrics.ActiveDevices(
        name=metric_name,
        series=series,
        buckets=downsampled_buckets,
        status=metrics_data["status"],
    )

    latest_active = 0
    if active_devices:
        latest_active = active_devices.get_number_latest_active_devices()
    
    return flask.jsonify(
        {
            "active_devices": dict(active_devices),
            "latest_active_devices": latest_active,
            "total_page_num": total_page_num
        }
    )


@login_required
def get_latest_active_devices(snap_name):
    snap_details = store_api.get_item_details(
        snap_name, api_version=2, fields=["snap-id"]
    )

    snap_id = snap_details["snap-id"]
    # get latest active devices
    latest_day_period = logic.extract_metrics_period("1d")
    latest_installed_base = logic.get_installed_based_metric("version")
    latest_day_query_json = metrics_helper.build_metric_query_installed_base(
        snap_id=snap_id,
        installed_base=latest_installed_base,
        metric_period=latest_day_period["int"],
        metric_bucket=latest_day_period["bucket"],
    )

    latest_day_response = publisher_api.get_publisher_metrics(
        flask.session, json=latest_day_query_json
    )

    latest_active = 0

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
    return flask.jsonify(
        {
            "latest_active_devices": latest_active,
        }
    )
    

@login_required
def get_metric_annotaion(snap_name):
    details = publisher_api.get_snap_info(snap_name, flask.session)
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
    return flask.jsonify(annotations)


@login_required
def get_country_metric(snap_name):
    snap_details = store_api.get_item_details(
        snap_name, api_version=2, fields=["snap-id"]
    )
    snap_id = snap_details["snap-id"]
    metrics_query_json = metrics_helper.build_metric_query_country(
        snap_id=snap_id,
    )

    metrics_response = publisher_api.get_publisher_metrics(
        flask.session, json=metrics_query_json
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

    return flask.jsonify(
        {
            "active_devices": country_devices.country_data,
            "territories_total": territories_total,
        }
    )
