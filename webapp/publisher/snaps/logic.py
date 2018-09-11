import hashlib
import datetime
from json import dumps


def get_snaps_account_info(account_info):
    """Get snaps from the account information of a user

    :param account_info The account informations

    :return A list of snaps
    :return A list of registred snaps
    """
    user_snaps = {}
    registered_snaps = {}
    if "16" in account_info["snaps"]:
        snaps = account_info["snaps"]["16"]
        for snap in snaps.keys():
            if snaps[snap]["status"] != "Revoked":
                if not snaps[snap]["latest_revisions"]:
                    registered_snaps[snap] = snaps[snap]
                else:
                    user_snaps[snap] = snaps[snap]

    now = datetime.datetime.utcnow()

    if len(user_snaps) == 1:
        for snap in user_snaps:
            snap_info = user_snaps[snap]
            revisions = snap_info["latest_revisions"]

            revision_since = datetime.datetime.strptime(
                revisions[-1]["since"], "%Y-%m-%dT%H:%M:%SZ"
            )

            if abs((revision_since - now).days) < 30 and (
                not revisions[0]["channels"]
                or revisions[0]["channels"][0] == "edge"
            ):
                snap_info["is_new"] = True

    return user_snaps, registered_snaps


def verify_base_metrics(active_devices):
    """Verify that the base metric exists in the list of available
    metrics

    :param active_devices The base metric

    :return The base metric if it's available, 'version' if not
    """
    if active_devices not in ("version", "os", "channel"):
        return "version"

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
        metric_period = "30d"

    metric_period_int = int(metric_period[:-1])
    metric_bucket = metric_period[-1:]
    if metric_bucket != "d" and metric_bucket != "m":
        metric_bucket = "d"

    return {
        "period": metric_period,
        "int": metric_period_int,
        "bucket": metric_bucket,
    }


def get_installed_based_metric(installed_base_metric):
    if installed_base_metric == "version":
        return "weekly_installed_base_by_version"
    elif installed_base_metric == "os":
        return "weekly_installed_base_by_operating_system"
    elif installed_base_metric == "channel":
        return "weekly_installed_base_by_channel"


def is_snap_on_stable(channel_maps_list):
    """Checks if the snap in on a stable channel

    :param channel_maps_list: The channel maps list of a snap

    :return: True is stable, False if not
    """
    is_on_stable = False
    for series in channel_maps_list:
        for series_map in series["map"]:
            is_on_stable = (
                is_on_stable
                or "channel" in series_map
                and series_map["channel"] == "stable"
                and series_map["info"]
            )

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
        "hash": hash_final,
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
        converted_metrics_blacklist = metrics_blacklist.split(",")

    return converted_metrics_blacklist


def remove_invalid_characters(description):
    """Remove invalid charcters from description

    :param description: The description

    :return: The description wihtou the invalid characters"""
    return description.replace("\r\n", "\n")


def build_changed_images(
    changed_screenshots, current_screenshots, icon, new_screenshots
):
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
            if changed_screenshot["url"] == current_screenshot["url"]:
                info.append(current_screenshot)

    # Add new icon
    if icon is not None:
        info.append(build_image_info(icon, "icon"))
        images_files.append(icon)

    # Add new screenshots
    for new_screenshot in new_screenshots:
        for changed_screenshot in changed_screenshots:
            is_same = (
                changed_screenshot["status"] == "new"
                and changed_screenshot["name"] == new_screenshot.filename
            )

            if is_same:
                info.append(build_image_info(new_screenshot, "screenshot"))
                images_files.append(new_screenshot)

    images_json = {"info": dumps(info)}

    return images_json, images_files


def filter_changes_data(changes):
    """Filter the changes posted to keep the valid fields

    :param changes: Dictionary of all the changes

    ":return: Dictionary with the changes filtered"""
    whitelist = [
        "title",
        "summary",
        "description",
        "contact",
        "website",
        "keywords",
        "license",
        "price",
        "private",
        "blacklist_countries",
        "whitelist_countries",
        "public_metrics_enabled",
        "public_metrics_blacklist",
        "whitelist_countries",
        "blacklist_countries",
    ]

    return {key: changes[key] for key in whitelist if key in changes}


def invalid_field_errors(errors):
    """Split errors in invalid fields and other errors

    :param erros: List of errors

    :return: List of fields errors and list of other errors"""
    field_errors = {}
    other_errors = []

    for error in errors:
        if error["code"] == "invalid-field" or error["code"] == "required":
            if "name" in error["extra"]:
                name = error["extra"]["name"]
            elif "field" in error["extra"]:
                name = error["extra"]["field"]
            field_errors[name] = error["message"]
        else:
            other_errors.append(error)

    return field_errors, other_errors
