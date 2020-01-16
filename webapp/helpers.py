import json

import flask
import os

from ruamel.yaml import YAML
from werkzeug.routing import BaseConverter


_yaml = YAML(typ="rt")
_yaml_safe = YAML(typ="safe")


def get_yaml_loader(typ="safe"):
    if typ == "safe":
        return _yaml_safe
    return _yaml


class RegexConverter(BaseConverter):
    def __init__(self, url_map, *items):
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]


def get_licenses():
    try:
        with open("webapp/store-licenses.json") as f:
            licenses = json.load(f)

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


def get_default_track(snap_name):
    # until default tracks are supported by the API we special case node
    # to use 10, rather then latest
    default_track = "10" if snap_name == "node" else None

    return default_track


def get_file(filename, replaces={}):
    """
    Reads a file, replaces occurences of all the keys in `replaces` with
    the correspondant values and returns the resulting string or None

    Keyword arguments:
    filename -- name if the file to load.
    replaces -- key/values to replace in the file content (default {})
    """
    filepath = os.path.join(flask.current_app.root_path, filename)

    try:
        with open(filepath, "r") as f:
            data = f.read()
            for key in replaces:
                data = data.replace(key, replaces[key])
    except Exception:
        data = None

    return data


def get_yaml(filename, typ="safe", replaces={}):
    """
    Reads a file, replaces occurences of all the keys in `replaces` with the
    correspondant values and returns an ordered dict with the YAML content

    Keyword arguments:
    filename -- name if the file to load.
    typ -- type of yaml loader
    replaces -- key/values to replace in the file content (default {})
    """
    try:
        yaml = get_yaml_loader(typ)
        data = get_file(filename, replaces)
        return yaml.load(data)
    except Exception:
        return None


def dump_yaml(data, stream, typ="safe"):
    yaml = get_yaml_loader(typ)
    yaml.dump(data, stream)
