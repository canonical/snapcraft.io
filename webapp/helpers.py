import json

from werkzeug.routing import BaseConverter


class RegexConverter(BaseConverter):
    def __init__(self, url_map, *items):
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]


def get_licenses():
    try:
        with open("webapp/licenses.json") as f:
            licenses = json.load(f)
    except Exception:
        licenses = {}

    return licenses
