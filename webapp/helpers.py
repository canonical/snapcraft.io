import json
import os
import hashlib

import flask
from canonicalwebteam.launchpad import Launchpad
from ruamel.yaml import YAML
from webapp.api.requests import PublisherSession, Session
from canonicalwebteam.store_api.stores.snapstore import SnapPublisher
import webapp.api.marketo as marketo_api

_yaml = YAML(typ="rt")
_yaml_safe = YAML(typ="safe")
api_session = Session()
api_publisher_session = PublisherSession()
marketo = marketo_api.Marketo()
publisher_api = SnapPublisher(api_publisher_session)

launchpad = Launchpad(
    username=os.getenv("LP_API_USERNAME"),
    token=os.getenv("LP_API_TOKEN"),
    secret=os.getenv("LP_API_TOKEN_SECRET"),
    session=api_publisher_session,
)


def get_yaml_loader(typ="safe"):
    if typ == "safe":
        return _yaml_safe
    return _yaml


def get_licenses():
    try:
        with open("webapp/licenses.json") as f:
            licenses = json.load(f)["licenses"]

        def _build_custom_license(license_id, license_name):
            return {"licenseId": license_id, "name": license_name}

        CUSTOM_LICENSES = [
            _build_custom_license("Proprietary", "Proprietary"),
            _build_custom_license("Other Open Source", "Other Open Source"),
            _build_custom_license(
                "AGPL-3.0+", "GNU Affero General Public License v3.0 or later"
            ),
        ]

        licenses = licenses + CUSTOM_LICENSES
    except Exception:
        licenses = []

    return licenses


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


def get_icon(media):
    icons = [m["url"] for m in media if m["type"] == "icon"]
    if len(icons) > 0:
        return icons[0]
    return ""


def get_publisher_data():
    # We don't use the data from this endpoint.
    # It is mostly used to make sure the user has signed
    # the terms and conditions.
    publisher_api.get_account(flask.session)

    flask_user = flask.session["publisher"]

    subscriptions = None

    # don't rely on marketo to show the page,
    # if anything fails, just continue and don't show
    # this section
    try:
        subscribed_to_newsletter = False
        marketo_user = marketo.get_user(flask_user["email"])
        if marketo_user:
            marketo_subscribed = marketo.get_newsletter_subscription(
                marketo_user["id"]
            )
            if marketo_subscribed.get("snapcraftnewsletter"):
                subscribed_to_newsletter = True

        subscriptions = {"newsletter": subscribed_to_newsletter}
    except Exception:
        if "sentry" in flask.current_app.extensions:
            flask.current_app.extensions["sentry"].captureException()

    flask_user["subscriptions"] = subscriptions
    context = {"publisher": flask_user}

    return context


def get_dns_verification_token(snap_name, domain):
    salt = os.getenv("DNS_VERIFICATION_SALT")
    token_string = f"{domain}:{snap_name}:{salt}"
    token = hashlib.sha256(token_string.encode("utf-8")).hexdigest()
    return token


def get_csp_as_str(csp={}):
    csp_str = ""
    for key, values in csp.items():
        csp_value = ""
        for value in values:
            csp_value = " ".join([csp_value, value])
        csp_str = " ".join([csp_str, "".join([key, csp_value, ";"])])
    return csp_str
