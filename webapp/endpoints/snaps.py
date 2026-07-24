import flask
from flask import make_response
from flask.json import jsonify
import json

import dns.resolver
import re

import webapp.helpers as helpers
from webapp.decorators import login_required, exchange_required
from webapp.store import logic
from webapp.config import LP_MAX_BUILD_PAGES
from webapp.api.launchpad_provenance import LaunchpadProvenance
from webapp.endpoints.utils import get_auditable_map_cache_key
from cache.cache_utility import redis_cache

from canonicalwebteam.store_api.devicegw import DeviceGW
from canonicalwebteam.store_api.dashboard import Dashboard

device_gateway = DeviceGW("snap", helpers.api_session)
dashboard = Dashboard(helpers.api_session)
launchpad_provenance = LaunchpadProvenance()

# Fields needed to resolve the default install revision per architecture.
AUDITABLE_FIELDS = ["revision", "version", "confinement", "download"]

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
    return {
        "links": details["snap"].get("links", {}),
    }


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


def _get_provenance_map(snap_name):
    """Return the (cached) Launchpad provenance map for a snap.

    The map is expensive to build (paginated Launchpad calls), so it is cached
    for an hour and shared by both auditable endpoints.
    """
    cache_key = get_auditable_map_cache_key(snap_name)
    cached = redis_cache.get(cache_key, expected_type=dict)
    if cached is not None:
        return cached

    provenance_map = launchpad_provenance.build_provenance_map(
        snap_name, LP_MAX_BUILD_PAGES
    )
    if provenance_map.get("complete"):
        redis_cache.set(cache_key, provenance_map, ttl=3600)
    return provenance_map


def _resolve_default_install(details):
    """Resolve the default install option to a single (architecture, revision).

    Mirrors what the detail page shows next to the Install button: default
    track, lowest available risk, and a deterministic architecture preference
    (amd64 if published, otherwise the first architecture sorted).
    """
    channel_maps = logic.convert_channel_maps(details.get("channel-map"))
    if not channel_maps:
        return None, None

    default_track = details.get("default-track") or "latest"
    lowest_risk = logic.get_lowest_available_risk(channel_maps, default_track)

    architecture = logic.get_default_architecture(channel_maps.keys())

    releases = channel_maps.get(architecture, {}).get(default_track, [])
    for release in releases:
        if release["risk"] == lowest_risk:
            return architecture, release["revision"]

    return architecture, None


@snaps.route('/api/<regex("' + snap_regex + '"):snap_name>/auditable')
def auditable(snap_name):
    """Public endpoint backing the provenance badge under the Install button.

    Returns the git commit the default install revision was built from on
    Launchpad. The ``status`` field distinguishes every outcome so the badge
    can react:

    - ``verified``: built on Launchpad from a public commit (commit returned).
    - ``unavailable``: a public GitHub recipe exists, but this revision has no
      matching build (e.g. uploaded manually).
    - ``not-provided``: no public provenance — no Launchpad recipe, or the
      recipe's repo is private / non-GitHub.
    - ``error``: couldn't load provenance right now (upstream/incomplete scan).

    Never raises to the user.
    """
    res = {"auditable": False, "status": "not-provided"}

    try:
        details = device_gateway.get_item_details(
            snap_name, api_version=2, fields=AUDITABLE_FIELDS
        )
        architecture, revision = _resolve_default_install(details)

        if architecture and revision:
            provenance_map = _get_provenance_map(snap_name)
            arch_map = provenance_map.get("revisions", {}).get(
                str(revision), {}
            )
            build = arch_map.get(architecture)
            github_repository = provenance_map.get("github_repository")

            base = {
                "auditable": False,
                "revision": revision,
                "architecture": architecture,
            }

            if build and build.get("commit_url"):
                res = {
                    **base,
                    "auditable": True,
                    "status": "verified",
                    "commit_sha": build["commit_sha"],
                    "github_repository": github_repository,
                    "commit_url": build["commit_url"],
                    "build_id": build.get("build_id"),
                    "build_url": build.get("build_url"),
                }
            elif not provenance_map.get("complete"):
                # Couldn't fully scan Launchpad
                res = {**base, "status": "error"}
            elif github_repository:
                # Public recipe exists, but this revision has no build/commit.
                res = {
                    **base,
                    "status": "unavailable",
                    "github_repository": github_repository,
                }
            else:
                # No public recipe (private or non-GitHub source).
                res = {**base, "status": "not-provided"}
    except Exception:
        res = {"auditable": False, "status": "error"}

    response = make_response(res, 200)
    response.cache_control.max_age = (
        0 if res.get("status") == "error" else 3600
    )
    return response


@snaps.route(
    '/api/<regex("' + snap_regex + '"):snap_name>/auditable-revisions'
)
def auditable_revisions(snap_name):
    """Public endpoint backing the Security tab's per-revision commit links.

    Returns commit links for the snap's recent revisions (bounded by
    LP_MAX_BUILD_PAGES). Revisions without provenance are simply absent.
    ``error`` is true when Launchpad couldn't be fully scanned, so the Security
    tab can distinguish "no provenance" from "couldn't load right now".
    """
    res = {"github_repository": None, "revisions": {}, "error": False}

    try:
        provenance_map = _get_provenance_map(snap_name)
        res["github_repository"] = provenance_map.get("github_repository")
        res["error"] = not provenance_map.get("complete")

        for revision, arch_map in provenance_map.get("revisions", {}).items():
            # A store revision maps to a single architecture build; take its
            # commit link for the per-revision table.
            for build in arch_map.values():
                if build.get("commit_url"):
                    res["revisions"][revision] = {
                        "commit_sha": build["commit_sha"],
                        "commit_url": build["commit_url"],
                        "build_id": build.get("build_id"),
                        "build_url": build.get("build_url"),
                    }
                    break
    except Exception:
        res = {"github_repository": None, "revisions": {}, "error": True}

    response = make_response(res, 200)
    response.cache_control.max_age = 0 if res.get("error") else 3600
    return response


@snaps.route("/api/store/<store_id>/snaps")
@login_required
@exchange_required
def get_store_snaps(store_id):
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
