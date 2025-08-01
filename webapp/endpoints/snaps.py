import flask
from flask import make_response

import dns.resolver
import re

import webapp.helpers as helpers

from canonicalwebteam.store_api.devicegw import DeviceGW

device_gateway = DeviceGW("snap", helpers.api_session)

FIELDS = [
    "title",
    "summary",
    "description",
    "license",
    "contact",
    "website",
    "publisher",
    "media",
    "download",
    "version",
    "created-at",
    "confinement",
    "categories",
    "trending",
    "unlisted",
    "links",
]
snaps = flask.Blueprint(
    "snaps",
    __name__,
)


snap_regex = "[a-z0-9-]*[a-z][a-z0-9-]*"


def _get_snap_link_fields(snap_name):
    details = device_gateway.get_item_details(
        snap_name, api_version=2, fields=FIELDS
    )
    context = {
        "links": details["snap"].get("links", {}),
    }
    return context


@snaps.route('/api/<regex("' + snap_regex + '"):snap_name>/verify')
def dns_verified_status(snap_name):
    res = {"primary_domain": False, "token": None}
    context = _get_snap_link_fields(snap_name)

    primary_domain = None

    if "website" in context["links"]:
        primary_domain = context["links"]["website"][0]

    if primary_domain:
        token = helpers.get_dns_verification_token(snap_name, primary_domain)

        domain = re.compile(r"https?://")
        domain = domain.sub("", primary_domain).strip().strip("/")

        res["token"] = token

        try:
            dns_txt_records = [
                dns_record.to_text()
                for dns_record in dns.resolver.resolve(domain, "TXT").rrset
            ]

            if f'"SNAPCRAFT_IO_VERIFICATION={token}"' in dns_txt_records:
                res["primary_domain"] = True

        except Exception:
            res["primary_domain"] = False

    response = make_response(res, 200)
    response.cache_control.max_age = "3600"
    return response
