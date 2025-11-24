import datetime
from dateutil import relativedelta
import math


def get_filter(metric_name, snap_id, start, end):
    return {
        "metric_name": metric_name,
        "snap_id": snap_id,
        "start": start.strftime("%Y-%m-%d"),
        "end": end.strftime("%Y-%m-%d"),
    }


def get_last_metrics_processed_date():
    # We want to give time to the store to proccess all the metrics,
    # since the metrics are processed during the night
    # https://github.com/canonical-web-and-design/snapcraft.io/pull/616
    three_hours = relativedelta.relativedelta(hours=3)
    last_metrics_processed = datetime.datetime.now() - three_hours

    # Add an extra day on Mondays and Sundays to prevent the reset issue.
    if (
        last_metrics_processed.weekday() == 0
        or last_metrics_processed.weekday() == 6
    ):
        days_to_skip = relativedelta.relativedelta(days=2)
    else:
        days_to_skip = relativedelta.relativedelta(days=1)

    return last_metrics_processed.date() - days_to_skip


def get_dates_for_metric(metric_period=30, metric_bucket="d"):
    end = get_last_metrics_processed_date()

    if metric_bucket == "d":
        start = end + relativedelta.relativedelta(days=-metric_period)
    elif metric_bucket == "m":
        start = end + relativedelta.relativedelta(months=-metric_period)
    elif metric_bucket == "y":
        # Go back an extra day to ensure the granularity increases
        start = end + relativedelta.relativedelta(
            years=-metric_period, days=-1
        )
    return {"end": end, "start": start}


def build_metric_query_installed_base(
    snap_id, installed_base, metric_period=30, metric_bucket="d"
):
    """Build the json that will be requested to the API

    :param snap_id The snap id
    :param installed_base_metric The base metric requested
    :param metric_period The metric period requested, by default 30
    :param metric_bucket The metric bucket, by default 'd'

    :returns A dictionary with the filters for the metrics API.
    """

    dates = get_dates_for_metric(metric_period, metric_bucket)
    return {
        "filters": [
            get_filter(
                metric_name=installed_base,
                snap_id=snap_id,
                start=dates["start"],
                end=dates["end"],
            ),
        ]
    }


def build_active_device_metric_query(snap_id, installed_base, end, start):
    return {
        "filters": [
            get_filter(
                metric_name=installed_base,
                snap_id=snap_id,
                start=start,
                end=end,
            ),
        ]
    }


def build_metric_query_country(snap_id):
    """Build the json that will be requested to the API

    :param snap_id The snap id
    :param installed_base_metric The base metric requested
    :param metric_period The metric period requested, by default 30
    :param metric_bucket The metric bucket, by default 'd'

    :returns A dictionary with the filters for the metrics API, by default
    returns also the 'weekly_installed_base_by_country'.
    """
    end = get_last_metrics_processed_date()

    return {
        "filters": [
            get_filter(
                metric_name="weekly_installed_base_by_country",
                snap_id=snap_id,
                start=end,
                end=end,
            ),
        ]
    }


def find_metric(full_response, name):
    """Find a named metric in a metric response

    :param full_response: The JSON response from the metrics API
    :name: Name of the metric to find

    :returns: A dictionary with the metric information
    """
    for metric in full_response:
        if metric["metric_name"] == name:
            return metric


def build_snap_installs_metrics_query(snaps, get_filter=get_filter):
    """Transforms an API response from the publisher metrics

    :param snaps: dict containing snaps we want metrics for
    :param get_filter: function that builds a single filter payload

    :returns: A dict containing a filter for each snap in snaps
    or empty if there are no snaps
    """
    if not snaps:
        return {}

    end = get_last_metrics_processed_date()
    start = end + relativedelta.relativedelta(months=-1)

    metrics_query = {"filters": []}
    for snap_name in snaps:
        metrics_query["filters"].append(
            get_filter(
                metric_name="weekly_device_change",
                snap_id=snaps[snap_name],
                start=start,
                end=end,
            )
        )

    return metrics_query


def fill_missing_values(values):
    """Fills out null values in a series according to these rules:
    - If null is in the middle take average of previous and next non-null vals
    - If null is at the end use the previous non-null value
    - If null is at the start use the next non-null value
    - If all values are null set to 0
    """
    if not values:
        return values

    filled = values.copy()
    n = len(filled)

    if all(v is None for v in filled):
        return [0] * n

    for i in range(n):
        if filled[i] is None:
            # Find previous non-null value
            prev_value = None
            prev_idx = i - 1
            while prev_idx >= 0 and prev_value is None:
                prev_value = filled[prev_idx]
                prev_idx -= 1

            # Find next non-null value
            next_value = None
            next_idx = i + 1
            while next_idx < n and next_value is None:
                next_value = filled[next_idx]
                next_idx += 1

            if prev_value is not None and next_value is not None:
                filled[i] = (prev_value + next_value) / 2
            elif prev_value is not None:
                filled[i] = prev_value
            elif next_value is not None:
                filled[i] = next_value
            else:
                filled[i] = 0

    return filled


def transform_metrics(metrics, metrics_response, snaps):
    """Transforms an API response from the publisher metrics

    :param metrics_response: The JSON response from the metrics API

    :returns: A dictionary with the metric information
    """
    for metric in metrics_response["metrics"]:
        if metric["status"] == "OK":
            snap_id = metric["snap_id"]

            snap_name = None
            for snaps_name, snaps_id in snaps.items():
                if snaps_id == snap_id:
                    snap_name = snaps_name

            filled_series = []
            for series in metric["series"]:
                filled_values = fill_missing_values(series["values"])
                filled_series.append(
                    {"name": series["name"], "values": filled_values}
                )

            metrics["snaps"].append(
                {"id": snap_id, "name": snap_name, "series": filled_series}
            )
            metrics["buckets"] = metric["buckets"]
    return metrics


def lttb_select_indices(values, target_size):
    """
    Selects indices using the LTTB algorithm for downsampling.
    Assumes values have already been filled (no None values).
    """
    n = len(values)
    if n <= target_size:
        return list(range(n))

    # Initialize bucket size
    bucket_size = (n - 2) / (target_size - 2)
    indices = []

    current_bucket_start = 0
    for i in range(1, target_size - 1):
        next_bucket_start = min(math.ceil((i + 1) * bucket_size), n - 1)

        max_area = 0
        max_area_idx = current_bucket_start

        point1 = (current_bucket_start, values[current_bucket_start])
        point2 = (next_bucket_start, values[next_bucket_start])

        for j in range(current_bucket_start + 1, next_bucket_start):
            val_j = values[j]

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

    indices.append(n - 1)
    return indices


def normalize_series(series, bucket_count):
    """
    Ensure all value arrays in the series have the same size
    by padding with 0s.
    """
    for item in series:
        values = item["values"]
        # If the series has no values, fill it with 0s
        if not values:
            item["values"] = [0] * bucket_count
        # Extend the values with 0 if they are shorter than the bucket count
        elif len(values) < bucket_count:
            item["values"].extend([0] * (bucket_count - len(values)))


def downsample_series(buckets, series, target_size):
    """Downsample each series in the data, filling missing values first."""
    downsampled_buckets = []
    downsampled_series = []

    # Handle case where series is empty
    if not series:
        return buckets[:target_size], []

    bucket_count = len(buckets)
    # Normalize series first to make sure all series have the same length
    normalize_series(series, bucket_count)

    # Downsample each series independently
    for item in series:
        name = item["name"]
        values = item["values"]

        # Fill missing values before downsampling
        filled_values = fill_missing_values(values)

        selected_indices = lttb_select_indices(filled_values, target_size)

        # Collect the buckets and values based on the selected indices
        downsampled_buckets = [buckets[i] for i in selected_indices]
        downsampled_values = [filled_values[i] for i in selected_indices]

        downsampled_series.append({"name": name, "values": downsampled_values})

    return downsampled_buckets, downsampled_series
