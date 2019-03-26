import json

from werkzeug.routing import BaseConverter


class RegexConverter(BaseConverter):
    def __init__(self, url_map, *items):
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]


def get_licenses():
    try:
        with open("webapp/licenses.json") as f:
            licenses_file = json.load(f)

        licenses = licenses_file["licenses"]

        def _build_custom_license(license_id, license_name):
            return {"licenseId": license_id, "name": license_name}

        CUSTOM_LICENSES = [
            _build_custom_license("Proprietary", "Proprietary"),
            _build_custom_license("Other Open Source", "Other Open Source"),
        ]

        licenses = licenses + CUSTOM_LICENSES
    except Exception:
        licenses = []

    return licenses


def get_default_track(snap_name):
    # until default tracks are supported by the API we special case node
    # to use 10, rather then latest
    default_track = "10" if snap_name == "node" else "latest"

    return default_track
