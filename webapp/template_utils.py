# Core
import hashlib
import os


# generator functions for templates
def generate_slug(path):
    """
    Generate a slug for each page
    """
    if path.endswith(
        (
            "/snaps",
            "/listing",
            "/releases",
            "/metrics",
            "/publicise",
            "/publicise/badges",
            "/publicise/cards",
            "/settings",
            "/account/details",
        )
    ):
        return "account"

    if path == "/" or path.startswith("/first-snap"):
        return "home"

    if path.startswith("/build"):
        return "build"

    if path.startswith("/blog"):
        return "blog"

    if path.startswith("/iot"):
        return "iot"

    return "store"


# template filters
def contains(arr, contents):
    """
    Template helper for detecting if an array contains an item
    """

    return contents in arr


def join(arr, separator=""):
    """
    Template helper for joining array items into a string, using a separator
    """

    return separator.join(arr)


def static_url(filename):
    """
    Template function for generating URLs to static assets:
    Given the path for a static file, output a url path
    with a hex hash as a query string for versioning
    """

    filepath = os.path.join("static", filename)
    url = "/" + filepath

    if not os.path.isfile(filepath):
        # Could not find static file
        return url

    # Use MD5 as we care about speed a lot
    # and not security in this case
    file_hash = hashlib.md5()
    with open(filepath, "rb") as file_contents:
        for chunk in iter(lambda: file_contents.read(4096), b""):
            file_hash.update(chunk)

    return url + "?v=" + file_hash.hexdigest()[:7]


def install_snippet(
    package_name, lowest_risk_available, default_track, confinement
):
    """
    Template function that returns the snippet value to
    install a snap to be used in distro pages and/or snap
    detail pages
    """

    snippet_value = "sudo snap install " + package_name

    if default_track != "latest":
        snippet_value += (
            " --channel=" + default_track + "/" + lowest_risk_available
        )
    elif lowest_risk_available != "stable":
        snippet_value += " --" + lowest_risk_available

    if confinement == "classic":
        snippet_value += " --classic"

    return snippet_value


def format_number(number: int):
    """
    Template function that transforms a int into a string
    with a comma between every thousands
    """
    return "{:,}".format(number)


def display_name(display_name, username):
    """Template function that returns the displayed name if the username
    is the same, or the dispayed name and the username if differents
    """
    if display_name.lower() == username.lower():
        return display_name
    else:
        return f"{display_name} ({username})"
