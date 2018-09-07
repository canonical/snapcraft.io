import datetime
from dateutil import relativedelta


def get_filter(metric_name, snap_id, start, end):
    return {
        "metric_name": metric_name,
        "snap_id": snap_id,
        "start": start.strftime('%Y-%m-%d'),
        "end": end.strftime('%Y-%m-%d')
    }


def get_last_metrics_processed_date():
    # We want to give time to the store to proccess all the metrics,
    # since the metrics are processed during the night
    # https://github.com/canonical-websites/snapcraft.io/pull/616
    twelve_hours = relativedelta.relativedelta(hours=12)
    last_metrics_processed = datetime.datetime.utcnow() - twelve_hours

    one_day = relativedelta.relativedelta(days=1)
    return last_metrics_processed.date() - one_day


def build_metrics_json(
        snap_id, installed_base, metric_period=30,
        metric_bucket='d'):
    """Build the json that will be requested to the API

    :param snap_id The snap id
    :param installed_base_metric The base metric requested
    :param metric_period The metric period requested, by default 30
    :param metric_bucket The metric bucket, by default 'd'

    :returns A dictionary with the filters for the metrics API, by default
    returns also the 'weekly_installed_base_by_country'.
    """
    end = get_last_metrics_processed_date()

    # -1 day counteracts an issue that the api call is inclusive of the dates
    # specified, meaning you receive 1 extra data point then required
    if metric_bucket == 'd':
        start = end - relativedelta.relativedelta(
            days=metric_period - 1)
    elif metric_bucket == 'm':
        start = end - relativedelta.relativedelta(
            months=metric_period,
            days=-1)

    return {
        "filters": [
            get_filter(
                metric_name=installed_base,
                snap_id=snap_id,
                start=start,
                end=end),
            get_filter(
                metric_name="weekly_installed_base_by_country",
                snap_id=snap_id,
                start=end,
                end=end)]}


def find_metric(full_response, name):
    """Find a named metric in a metric response

    :param full_response: The JSON response from the metrics API
    :name: Name of the metric to find

    :returns: A dictionary with the metric information
    """
    for metric in full_response:
        if metric['metric_name'] == name:
            return metric
