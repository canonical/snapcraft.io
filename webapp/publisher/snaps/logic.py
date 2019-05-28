import datetime
import hashlib
from json import dumps

from dateutil import parser


def get_snaps_account_info(account_info):
    """Get snaps from the account information of a user

    :param account_info: The account informations

    :return: A list of snaps
    :return: A list of registred snaps
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

    for snap in user_snaps:
        snap_info = user_snaps[snap]
        for revision in snap_info["latest_revisions"]:
            if len(revision["channels"]) > 0:
                snap_info["latest_release"] = revision
                break

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


def get_snap_names_by_ownership(account_info):
    """Get list of snaps names user is collaborator of

    :param account_info: The account informations

    :return: A list of owned snaps names
    :return: A list of shared snaps names
    """

    snaps, registered_names = get_snaps_account_info(account_info)

    owned_snaps_names = []
    shared_snaps_names = []

    for snap in snaps:
        if snaps[snap]["publisher"]["username"] == account_info["username"]:
            owned_snaps_names.append(snap)
        else:
            shared_snaps_names.append(snap)

    return owned_snaps_names, shared_snaps_names


def verify_base_metrics(active_devices):
    """Verify that the base metric exists in the list of available
    metrics

    :param active_devices: The base metric

    :return: The base metric if it's available, 'version' if not
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

    :param metric_period: The metric period requested

    :returns: A dictionnary with the differents values of the period
    """
    allowed_periods = ["d", "m", "y"]

    if not metric_period[:-1].isdigit():
        metric_period = "30d"

    metric_period_int = int(metric_period[:-1])
    metric_bucket = metric_period[-1:]
    if metric_bucket not in allowed_periods:
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


def remove_invalid_characters(description):
    """Remove invalid charcters from description

    :param description: The description

    :return: The description wihtou the invalid characters"""
    return description.replace("\r\n", "\n")


def build_changed_images(
    changed_screenshots,
    current_screenshots,
    icon,
    new_screenshots,
    banner_background,
):
    """Filter and build images to upload.

    :param changed_screenshots: Dictionary of all the changed screenshots
    :param current_screenshots: Ductionary of the current screenshots
    :param icon: The uploaded icon
    :param new_screenshots: The uploaded screenshots
    :param banner_background: The uploaded banner
    :param banner_icon: The uploaded banner icon

    :return: The json to send to the store and the list images to upload"""

    info = []
    images_files = []
    images_json = None

    # Get screenshots info (existing and new) while keeping the order recieved
    for changed_screenshot in changed_screenshots:
        for current_screenshot in current_screenshots:
            if (
                changed_screenshot
                and changed_screenshot["url"] == current_screenshot["url"]
                and current_screenshot not in info
            ):
                info.append(current_screenshot)
                break
        for new_screenshot in new_screenshots:
            is_same = (
                changed_screenshot["status"] == "new"
                and changed_screenshot["name"] == new_screenshot.filename
            )

            if is_same:
                image_built = build_image_info(new_screenshot, "screenshot")
                if image_built not in info:
                    info.append(image_built)
                    images_files.append(new_screenshot)
                    break

    # Add new icon
    if icon is not None:
        info.append(build_image_info(icon, "icon"))
        images_files.append(icon)

    # Add new banner background
    if banner_background is not None:
        info.append(build_image_info(banner_background, "banner"))
        images_files.append(banner_background)

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
        "unlisted",
        "blacklist_countries",
        "whitelist_countries",
        "public_metrics_enabled",
        "public_metrics_blacklist",
        "whitelist_countries",
        "blacklist_countries",
        "license",
        "video_urls",
        "categories",
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


def replace_reserved_categories_key(categories):
    """The API returns `items` which is a reserved word in jinja2.
    This method renames that key for snap_categories.

    :param categories: Dict of categories

    :return: Dict of categories"""
    snap_categories = categories
    snap_categories["categories"] = snap_categories["items"]

    del snap_categories["items"]

    return snap_categories


def filter_categories(categories):
    """Filter featured category out of the list of categories on a snap

    :param categories: Dict of categories

    :return: Dict of categories"""
    snap_categories = categories

    snap_categories["categories"] = list(
        filter(
            lambda category: category["name"] != "featured",
            snap_categories["categories"],
        )
    )

    return snap_categories


def filter_available_stores(stores):
    """Available stores that aren't publicly available

    :param stores: List of stores as per the account endpoint

    :return: List of stores
    """
    public_stores = ["ubuntu", "LimeNET", "LimeSDR", "orange-pi"]

    available_stores = []
    for store in stores:
        if "access" in store["roles"] and store["id"] not in public_stores:
            available_stores.append(store)

    return available_stores


def convert_date(date_to_convert):
    """Convert date to human readable format: Month Year

    Format of date to convert: 2019-01-12T16:48:41.821037+00:00
    Output: January 2019

    :param date_to_convert: Date to convert
    :returns: Readable date
    """
    date_parsed = parser.parse(date_to_convert).replace(tzinfo=None)
    return date_parsed.strftime("%B %Y")


def categorise_media(media):
    """Media comes in many forms, method splits them into:
    Icons, Screenshots and Banner images

    :param media: a list of media dicts
    :returns: Separate lists for the media types"""

    banner_urls = []
    icon_urls = []
    screenshot_urls = []

    for m in media:
        if m["type"] == "banner":
            banner_urls.append(m["url"])
        elif m["type"] == "icon":
            icon_urls.append(m["url"])
        elif m["type"] == "screenshot":
            screenshot_urls.append(m["url"])

    return icon_urls, screenshot_urls, banner_urls
