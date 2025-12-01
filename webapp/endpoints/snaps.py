import flask
from flask import make_response
from flask.json import jsonify
import json

import dns.resolver
import re

import webapp.helpers as helpers
from webapp.decorators import login_required, exchange_required

from canonicalwebteam.store_api.devicegw import DeviceGW
from canonicalwebteam.store_api.dashboard import Dashboard
from cache.cache_utility import redis_cache
from webapp.endpoints.utils import get_item_details_cache_key

device_gateway = DeviceGW("snap", helpers.api_session)
dashboard = Dashboard(helpers.api_session)

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
    get_item_details_key = get_item_details_cache_key(snap_name)
    cached_snap_details = redis_cache.get(
        get_item_details_key, expected_type=dict
    )
    if cached_snap_details:
        details = cached_snap_details
    else:
        details = device_gateway.get_item_details(
            snap_name, api_version=2, fields=FIELDS
        )
        context = {
            "links": details["snap"].get("links", {}),
        }
        redis_cache.set(get_item_details_key, details, ttl=300)
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

        domain = re.compile(r"https?://(www\.)?")
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


@snaps.route("/api/store/<store_id>/snaps")
@login_required
@exchange_required
def get_store_snaps(store_id):
    cached_store_snaps = redis_cache.get(
        f"store-snaps-{store_id}", expected_type=list
    )
    if cached_store_snaps:
        return jsonify(cached_store_snaps)

    snaps = dashboard.get_store_snaps(flask.session, store_id)
    store = dashboard.get_store(flask.session, store_id)
    if "store-whitelist" in store:
        included_stores = []
        for item in store["store-whitelist"]:
            try:
                store_item = dashboard.get_store(flask.session, item)
                if store_item:
                    included_stores.append(
                        {
                            "id": store_item["id"],
                            "name": store_item["name"],
                            "userHasAccess": True,
                        }
                    )
            except Exception:
                included_stores.append(
                    {
                        "id": item,
                        "name": "Private store",
                        "userHasAccess": False,
                    }
                )

        if included_stores:
            snaps.append({"included-stores": included_stores})
    redis_cache.set(f"store-snaps-{store_id}", snaps, ttl=300)
    return jsonify(snaps)


@snaps.route("/api/store/<store_id>/snaps", methods=["POST"])
@login_required
@exchange_required
def post_manage_store_snaps(store_id):
    snaps = json.loads(flask.request.form.get("snaps"))

    res = {}

    dashboard.update_store_snaps(flask.session, store_id, snaps)
    res["msg"] = "Changes saved"

    return jsonify({"success": True})
