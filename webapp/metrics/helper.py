import datetime
from dateutil import relativedelta


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
    last_metrics_processed = datetime.datetime.utcnow() - three_hours

    one_day = relativedelta.relativedelta(days=1)
    return last_metrics_processed.date() - one_day


def build_metrics_json(
    snap_id, installed_base, metric_period=30, metric_bucket="d"
):
    """Build the json that will be requested to the API

    :param snap_id The snap id
    :param installed_base_metric The base metric requested
    :param metric_period The metric period requested, by default 30
    :param metric_bucket The metric bucket, by default 'd'

    :returns A dictionary with the filters for the metrics API, by default
    returns also the 'weekly_installed_base_by_country'.
    """
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

    return {
        "filters": [
            get_filter(
                metric_name=installed_base,
                snap_id=snap_id,
                start=start,
                end=end,
            ),
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
    start = end + relativedelta.relativedelta(years=-1, days=-1)

    metrics_query = {"filters": []}
    for snap_id in snaps:
        metrics_query["filters"].append(
            get_filter(
                metric_name="weekly_device_change",
                snap_id=snap_id,
                start=start,
                end=end,
            )
        )
    return metrics_query


def transform_metrics(metrics, metrics_response):
    """Transforms an API response from the publisher metrics

    :param metrics_response: The JSON response from the metrics API

    :returns: A dictionary with the metric information
    """
    for metric in metrics_response["metrics"]:
        if metric["status"] == "OK":
            snap_id = metric["snap_id"]

            metrics["snaps"].append(
                {"id": snap_id, "series": metric["series"]}
            )
            metrics["buckets"] = metric["buckets"]

    return metrics
