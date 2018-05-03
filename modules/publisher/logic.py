import datetime
import hashlib
from dateutil import relativedelta
from json import dumps


def get_snaps_account_info(account_info):
    """Get snaps from the account information of a user

    :param account_info The account informations

    :return A list of snaps
    :return A list of registred snaps
    """
    user_snaps = {}
    registered_snaps = {}
    if '16' in account_info['snaps']:
        snaps = account_info['snaps']['16']
        for snap in snaps.keys():
            if not snaps[snap]['latest_revisions']:
                registered_snaps[snap] = snaps[snap]
            else:
                user_snaps[snap] = snaps[snap]

    return user_snaps, registered_snaps


def verify_base_metrics(active_devices):
    """Verify that the base metric exists in the list of available
    metrics

    :param active_devices The base metric

    :return The base metric if it's available, 'version' if not
    """
    if active_devices not in ('version', 'os', 'channel'):
        return 'version'

    return active_devices


def extract_metrics_period(metric_period):
    """Extract the different values from the period requested. The format of
    the metric_period should be: [0-9]+[dm]
    If the metric_period is invalid the default value is 30d

    Input:
      30d

    Output:
      {
        'period': '30d',
        'int': 30,
        'bucket': 30
      }

    :param metric_period The metric period requested

    :returns A dictionnary with the differents values of the period
    """
    if not metric_period[:-1].isdigit():
        metric_period = '30d'

    metric_period_int = int(metric_period[:-1])
    metric_bucket = metric_period[-1:]
    if metric_bucket != 'd' and metric_bucket != 'm':
        metric_bucket = 'd'

    return {
        'period': metric_period,
        'int': metric_period_int,
        'bucket': metric_bucket
    }


def build_metrics_json(
        snap_id, metric_period=30,
        metric_bucket='d', installed_base_metric='version'):
    """Build the json that will be requested to the API

    :param snap_id The snap id
    :param metric_period The metric period requested, by default 30
    :param metric_bucket The metric bucket, by default 'd'
    :param installed_base_metric The base metric requested

    :returns A dictionnary with the filters for the metrics API, by default
    returns also the 'weekly_installed_base_by_country'.
    """

    # We want to give time to the store to preoccess all the metrics,
    # since the metrics are processed during the night
    # https://github.com/canonical-websites/snapcraft.io/pull/616
    twelve_hours = relativedelta.relativedelta(hours=12)
    last_metrics_processed = datetime.datetime.utcnow() - twelve_hours

    one_day = relativedelta.relativedelta(days=1)
    previous_processed_metrics = last_metrics_processed.date() - one_day

    start = None
    if metric_bucket == 'd':
        start = previous_processed_metrics - relativedelta.relativedelta(
            days=metric_period)
    elif metric_bucket == 'm':
        start = previous_processed_metrics - relativedelta.relativedelta(
            months=metric_period)

    if installed_base_metric == 'version':
        installed_base = "weekly_installed_base_by_version"
    elif installed_base_metric == 'os':
        installed_base = "weekly_installed_base_by_operating_system"
    elif installed_base_metric == 'channel':
        installed_base = 'weekly_installed_base_by_channel'

    return {
        "filters": [
            {
                "metric_name": installed_base,
                "snap_id": snap_id,
                "start": start.strftime('%Y-%m-%d'),
                "end": previous_processed_metrics.strftime('%Y-%m-%d')
            },
            {
                "metric_name": "weekly_installed_base_by_country",
                "snap_id": snap_id,
                "start": previous_processed_metrics.strftime('%Y-%m-%d'),
                "end": previous_processed_metrics.strftime('%Y-%m-%d')
            }
        ]
    }


def has_data(metrics):
    """Verifies if one of the metrics has no data

    :param metrics A list of metrics

    :returns True if one of the metrics has no data, False if
    all the metrics have data
    """
    nodata = True
    for metric in metrics:
        if metric['status'] == 'OK':
            nodata = False

    return nodata


def get_number_latest_active_devices(active_devices):
    """Get the number of latest active devices from the list of active devices.

    :param active_devices The list of active devices of a period

    :returns The number of lastest active devices
    """
    latest_active_devices = 0

    for series_index, series in enumerate(active_devices['series']):
        for index, value in enumerate(series['values']):
            if value is None:
                active_devices['series'][series_index]['values'][index] = 0
        values = series['values']
        if len(values) == len(active_devices['buckets']):
            latest_active_devices += values[len(values)-1]

    return latest_active_devices


def get_number_territories(country_data):
    """Get the number of territories with users

    :param country_data The list of country

    :returns The number of territories with users
    """
    territories_total = 0
    for data in country_data.values():
        if data['number_of_users'] > 0:
            territories_total += 1

    return territories_total


def is_snap_on_stable(channel_maps_list):
    """Checks if the snap in on a stable channel

    :param channel_maps_list: The channel maps list of a snap

    :return: True is stable, False if not
    """
    is_on_stable = False
    for series in channel_maps_list:
        for series_map in series['map']:
            is_on_stable = is_on_stable or \
                'channel' in series_map and \
                series_map['channel'] == 'stable' and \
                series_map['info']

    return is_on_stable


def build_image_info(image, image_type):
    """
    Build info json structure for image upload
    Return json oject with useful informations for the api
    """
    hasher = hashlib.sha256(image.read())
    hash_final = hasher.hexdigest()
    image.seek(0)

    return {
        "key": image.filename,
        "type": image_type,
        "filename": image.filename,
        "hash": hash_final
    }


def convert_metrics_blacklist(metrics_blacklist):
    """Convert the blacklisted metrics to an array

    Input:
      "metric1,metric2"
    Output:
      ["metric1", "metric2"]

    :param metrics_blacklist: The metrics blacklisted

    :return: Array of metrics"""
    converted_metrics_blacklist = []
    if len(metrics_blacklist) > 0:
        converted_metrics_blacklist = metrics_blacklist.split(',')

    return converted_metrics_blacklist


def remove_invalid_characters(description):
    """Remove invalid charcters from description

    :param description: The description

    :return: The description wihtou the invalid characters"""
    return description.replace('\r\n', '\n')


def build_changed_images(
        changed_screenshots,
        current_screenshots,
        icon,
        new_screenshots):
    """Filter and build images to upload.

    :param changed_screenshots: Dictionary of all the changed screenshots
    :param current_screenshots: Ductionary of the current screenshots
    :param icon: The uploaded icon
    :param new_screenshots: The uploaded screenshots

    :return: The json to send to the store and the list images to upload"""

    info = []
    images_files = []
    images_json = None
    for changed_screenshot in changed_screenshots:
        for current_screenshot in current_screenshots:
            if changed_screenshot['url'] == current_screenshot['url']:
                info.append(current_screenshot)

    # Add new icon
    if icon is not None:
        info.append(build_image_info(icon, 'icon'))
        images_files.append(icon)

    # Add new screenshots
    for new_screenshot in new_screenshots:
        for changed_screenshot in changed_screenshots:
            is_same = (
                changed_screenshot['status'] == 'new' and
                changed_screenshot['name'] == new_screenshot.filename
            )

            if is_same:
                info.append(
                    build_image_info(
                        new_screenshot, 'screenshot'))
                images_files.append(new_screenshot)

    images_json = {'info': dumps(info)}

    return images_json, images_files


def filter_changes_data(changes):
    """Filter the changes posted to keep the valid fields

    :param changes: Dictionary of all the changes

    ":return: Dictionary with the changes filtered"""
    whitelist = [
        'title',
        'summary',
        'description',
        'contact',
        'website',
        'keywords',
        'license',
        'price',
        'blacklist_countries',
        'whitelist_countries',
        'public_metrics_enabled',
        'public_metrics_blacklist'
    ]

    return {
        key: changes[key]
        for key in whitelist if key in changes
    }


def invalid_filed_errors(errors):
    """Split errors in invalid fields and other errors

    :param erros: List of errors

    :return: List of fields errors and list of other errors"""
    field_errors = {}
    other_errors = []

    for error in errors:
        if (error['code'] == 'invalid-field' or error['code'] == 'required'):
            field_errors[error['extra']['name']] = error['message']
        else:
            other_errors.append(error)

    return field_errors, other_errors
