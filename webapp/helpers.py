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
            _build_custom_license(
                "AGPL-3.0+", "GNU Affero General Public License v3.0 or later"
            ),
            _build_custom_license(
                "GPL-2.0+", "GNU General Public License v2.0 or later"
            ),
            _build_custom_license(
                "GPL-3.0+", "GNU General Public License v3.0 or later"
            ),
            _build_custom_license(
                "LGPL-2.1+", "GNU Lesser General Public License v2.1 or later"
            ),
            _build_custom_license(
                "LGPL-3.0+", "GNU Lesser General Public License v3.0 or later"
            ),
        ]

        licenses = licenses + CUSTOM_LICENSES
    except Exception:
        licenses = []

    return licenses
