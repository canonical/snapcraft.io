# Standard library
from json import loads

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

import time
from dateutil import relativedelta
from datetime import datetime
import math

publisher_api = SnapPublisher(api_publisher_session)
store_api = SnapStore(api_publisher_session)


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


def lttb_select_indices(values, target_size):
    """Selects indices using the LTTB algorithm for downsampling, treating None as 0."""
    n = len(values)
    if n <= target_size:
        return list(range(n))

    # Initialize bucket size
    bucket_size = (n - 2) / (target_size - 2)
    indices = []

    current_bucket_start = 0
    for i in range(1, target_size - 1):
        # Ensure next_bucket_start doesn't exceed n - 1
        next_bucket_start = min(math.ceil((i + 1) * bucket_size), n - 1)

        max_area = 0
        max_area_idx = current_bucket_start

        # Get point1 and point2, treating None as 0
        point1 = (current_bucket_start, values[current_bucket_start] if values[current_bucket_start] is not None else 0)
        point2 = (next_bucket_start, values[next_bucket_start] if values[next_bucket_start] is not None else 0)

        # Calculate the area for each valid index between current and next bucket
        for j in range(current_bucket_start + 1, next_bucket_start):
            val_j = values[j] if values[j] is not None else 0

            # Area of triangle formed by point1, point2, and the current point
            area = abs(
                (point1[0] - point2[0]) * (val_j - point1[1])
                - (point1[0] - j) * (point2[1] - point1[1])
            )
            if area > max_area:
                max_area = area
                max_area_idx = j

        indices.append(max_area_idx)
        current_bucket_start = next_bucket_start

    indices.append(n - 1)  # Always keep the last point
    return indices

def normalize_series(series):
    """Ensure all value arrays in the series have the same size by padding shorter arrays with None."""
    max_length = max(len(item['values']) for item in series)

    for item in series:
        values = item['values']
        # Extend the values with None if they are shorter than the max length
        if len(values) < max_length:
            values.extend([None] * (max_length - len(values)))

def downsample_series(buckets, series, target_size):
    """Downsample each series in the data, treating None as 0."""
    downsampled_buckets = []
    downsampled_series = []

    # Normalize series first to make sure all series have the same length
    normalize_series(series)

    # Downsample each series independently
    for item in series:
        name = item['name']
        values = item['values']
        
        # Get the LTTB-selected indices
        selected_indices = lttb_select_indices(values, target_size)
        
        # Collect the downsampled buckets and values based on the selected indices
        downsampled_buckets = [buckets[i] for i in selected_indices]
        downsampled_values = [values[i] if values[i] is not None else 0 for i in selected_indices]

        downsampled_series.append({
            'name': name,
            'values': downsampled_values
        })

    return downsampled_buckets, downsampled_series

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

    page_time_length = 3
    total_page_num = 1
    if metric_requested_bucket == "d" or (metric_requested_bucket == "m" and page_time_length >= metric_requested_length):
        end = metrics_helper.get_last_metrics_processed_date()

        if metric_requested_bucket == "d":
            start = end + relativedelta.relativedelta(days=-metric_requested_length)
        elif metric_requested_bucket == "m":
            start = end + relativedelta.relativedelta(months=-metric_requested_length)
        elif metric_requested_bucket == "y":
            # Go back an extra day to ensure the granularity increases
            start = end + relativedelta.relativedelta(
                years=-metric_requested_length, days=-1
            )
    else:
        if metric_requested_bucket == 'y':
            total_page_num = math.floor((metric_requested_length * 12) / page_time_length)
        else:
            total_page_num = math.floor(metric_requested_length / page_time_length)

        end = metrics_helper.get_last_metrics_processed_date() + (relativedelta.relativedelta(months=-(page_time_length*(page -1))))
        start = end + (relativedelta.relativedelta(months=-(page_time_length)))
        if  page != 1:
            end = end + relativedelta.relativedelta(days=-1)
       
    print(start, end, page, total_page_num)

    installed_base = logic.get_installed_based_metric(installed_base_metric)

    new_metrics_query = metrics_helper.build_metric_query_installed_base_new(
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
    # Extract buckets and series
    metrics_data = active_metrics
    buckets = metrics_data['buckets']
    series = metrics_data['series']
    metric_name = metrics_data['metric_name']

    print("bucket size: ", len(buckets), ", series: ", len(series))

    # Target size for downsampling
    target_size = 20

    # Perform downsampling
    downsampled_buckets, downsampled_series = downsample_series(buckets, series, target_size)
    print(len(downsampled_buckets), len(downsampled_series), target_size)
    

    series = downsampled_series
    if metric_name == "weekly_installed_base_by_channel":
        for s in series:
            if "/" not in s["name"]:
                s["name"] = f"latest/{s['name']}"

    if installed_base_metric == "os":
        capitalized_series = series
        for item in capitalized_series:
            item["name"] = metrics._capitalize_os_name(item["name"])
        series = capitalized_series

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
    # return flask.jsonify(
    #     {
    #         "active_devices": dict({}),
    #         "latest_active_devices": 0,
    #         "total_page_num": total_page_num
    #     }
    # )


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
