from canonicalwebteam.exceptions import (
    StoreApiResourceNotFound,
    StoreApiResponseErrorList,
)
import flask
from flask import make_response
from flask.json import jsonify
import json

import dns.resolver
import re

import webapp.helpers as helpers
from webapp.decorators import login_required, exchange_required
from webapp.store import logic
from webapp.config import LP_MAX_BUILD_PAGES, LP_MAX_RECIPES
from webapp.api.exceptions import ApiError, ApiTimeoutError
from webapp.api.github import repository_is_public
from webapp.api.launchpad_provenance import LaunchpadProvenance
from webapp.endpoints.utils import get_auditable_map_cache_key
from cache.cache_utility import redis_cache
from webapp.helpers import get_yaml_loader

from canonicalwebteam.store_api.devicegw import DeviceGW
from canonicalwebteam.store_api.dashboard import Dashboard

device_gateway = DeviceGW("snap", helpers.api_session)
dashboard = Dashboard(helpers.api_session)
launchpad_provenance = LaunchpadProvenance()

# Fields needed to resolve the default install revision per architecture.
AUDITABLE_FIELDS = ["revision", "version", "confinement", "download"]

# Bounds the retry rate against Launchpad without pinning a transient
# failure for a full hour.
FAILED_PROVENANCE_TTL = 60

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


def _request_failure_reason(exc):
    if isinstance(exc, ApiTimeoutError):
        return "store_timeout"
    if isinstance(exc, ApiError):
        return "store_error"
    return "unexpected_error"


def _get_provenance_map(snap_name):
    """Return the (cached) Launchpad provenance map for a snap.

    The map is expensive to build (paginated Launchpad calls), so it is cached
    for an hour and shared by both auditable endpoints.

    Failures are cached briefly rather than not at all: every page view
    fetches provenance, so skipping the cache on failure would send each one
    back to an already-struggling Launchpad. The repository check lives here
    so its single GitHub call rides the same cache.
    """
    cache_key = get_auditable_map_cache_key(snap_name)
    cached = redis_cache.get(cache_key, expected_type=dict)
    if cached is not None:
        return cached

    provenance_map = launchpad_provenance.build_provenance_map(
        snap_name, LP_MAX_BUILD_PAGES, LP_MAX_RECIPES
    )
    provenance_map["source_available"] = repository_is_public(
        provenance_map.get("github_repository")
    )
    ttl = FAILED_PROVENANCE_TTL if provenance_map.get("failed") else 3600
    redis_cache.set(cache_key, provenance_map, ttl=ttl)
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

    published = [
        arch
        for arch, tracks in channel_maps.items()
        if any(
            release["risk"] == lowest_risk
            for release in tracks.get(default_track, [])
        )
    ]
    architecture = logic.get_default_architecture(
        published or channel_maps.keys()
    )

    releases = channel_maps.get(architecture, {}).get(default_track, [])
    for release in releases:
        if release["risk"] == lowest_risk:
            return architecture, release["revision"]

    return architecture, None


@snaps.route('/api/<regex("' + snap_regex + '"):snap_name>/auditable')
def auditable(snap_name):
    """Public endpoint backing the provenance badge under the Install button"""
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
            # The map can span recipes, so prefer the row's own repository.
            github_repository = (build or {}).get(
                "github_repository"
            ) or provenance_map.get("github_repository")
            launchpad_repository = (build or {}).get(
                "launchpad_repository"
            ) or provenance_map.get("launchpad_repository")

            base = {
                "auditable": False,
                "revision": revision,
                "architecture": architecture,
            }

            source_available = provenance_map.get("source_available", True)

            if build and build.get("commit_url") and source_available:
                res = {
                    **base,
                    "auditable": True,
                    "status": "verified",
                    "commit_sha": build["commit_sha"],
                    "github_repository": github_repository,
                    "launchpad_repository": launchpad_repository,
                    "commit_url": build["commit_url"],
                    "build_id": build.get("build_id"),
                    "build_url": build.get("build_url"),
                }
            elif build:
                # No commit to link (Launchpad-hosted or private source), or
                # the repository has gone. Both are settled answers, not
                # failed lookups.
                res = {**base, "status": "not-provided"}
            elif provenance_map.get("failed"):
                # Only a real failure earns the error state, since it is the
                # only case where "try again later" is true.
                res = {
                    **base,
                    "status": "error",
                    "reason": provenance_map.get("reason"),
                }
            elif github_repository or launchpad_repository:
                # Public recipe exists, but this revision has no build/commit.
                res = {
                    **base,
                    "status": "unavailable",
                    "github_repository": github_repository,
                    "launchpad_repository": launchpad_repository,
                }
            else:
                # No public recipe.
                res = {**base, "status": "not-provided"}
    except Exception as exc:
        res = {
            "auditable": False,
            "status": "error",
            "reason": _request_failure_reason(exc),
        }

    response = make_response(res, 200)
    response.cache_control.max_age = (
        FAILED_PROVENANCE_TTL if res.get("status") == "error" else 3600
    )
    return response


@snaps.route(
    '/api/<regex("' + snap_regex + '"):snap_name>/auditable-revisions'
)
def auditable_revisions(snap_name):
    """Public endpoint backing the Security tab's per-revision commit links"""
    res = {
        "github_repository": None,
        "revisions": {},
        "error": False,
        "reason": None,
    }

    try:
        provenance_map = _get_provenance_map(snap_name)
        res["github_repository"] = provenance_map.get("github_repository")
        res["error"] = bool(provenance_map.get("failed"))
        res["reason"] = provenance_map.get("reason")

        # If the repository is gone, every commit link would 404.
        if provenance_map.get("source_available", True):
            for revision, arch_map in provenance_map["revisions"].items():
                # One architecture build per store revision.
                for build in arch_map.values():
                    if build.get("commit_url"):
                        res["revisions"][revision] = {
                            "commit_sha": build["commit_sha"],
                            "commit_url": build["commit_url"],
                            "build_id": build.get("build_id"),
                            "build_url": build.get("build_url"),
                        }
                        break
    except Exception as exc:
        res = {
            "github_repository": None,
            "revisions": {},
            "error": True,
            "reason": _request_failure_reason(exc),
        }

    response = make_response(res, 200)
    response.cache_control.max_age = (
        FAILED_PROVENANCE_TTL if res.get("error") else 3600
    )
    return response


@snaps.route('/api/<regex("' + snap_regex + '"):snap_name>/permissions')
def permissions(snap_name):
    """Return the permissions that a snap requests for one specific channel
    and architecture.

    This endpoint needs the ``channel`` and ``architecture`` query parameters.
    It gets the channel map, finds the matching channel and architecture, and
    parses the ``snap-yaml`` field.

    The response contains:
    - ``confinement`` from ``snap-yaml``
    - ``interfaces`` as ``[{"name": <plug name>, "interface": <interface>}]``

    If a query parameter is missing, this endpoint returns HTTP 400.
    If lookup or parsing fails, the response contains an ``errors`` list.
    """
    missing_params = [
        p for p in ("channel", "architecture") if not flask.request.args.get(p)
    ]

    if missing_params:
        return make_response(
            {
                "success": False,
                "errors": [
                    f'"{param}" parameter is required'
                    for param in missing_params
                ],
            },
            400,
        )

    channel = flask.request.args.get("channel")
    architecture = flask.request.args.get("architecture")

    try:
        details = device_gateway.get_item_details(
            snap_name, api_version=2, fields=["snap-yaml"]
        )
    except StoreApiResourceNotFound:
        return make_response(
            {
                "success": False,
                "errors": [f'"{snap_name}" does not exist'],
            },
            404,
        )
    except StoreApiResponseErrorList as e:
        return make_response(
            {
                "success": False,
                "errors": [
                    f"{error.get('message', 'An error occurred')}"
                    for error in e.errors
                ],
            },
            e.status_code,
        )

    def predicate(_channel):
        channel_entry = _channel.get("channel", {})
        name: str = channel_entry.get("name", "")
        arch: str = channel_entry.get("architecture", "")
        return name == channel and arch == architecture

    try:
        channel_map = details.get("channel-map", [])
        match = next((c for c in channel_map if predicate(c)), None)

        if match is None:
            raise Exception(
                f'channel "{channel}" does not exist for architecture '
                f'"{architecture}"'
            )

        raw_snap_yaml = match.get("snap-yaml")
        snap_yaml = get_yaml_loader().load(raw_snap_yaml)

        res = {
            "success": True,
            "data": {
                "confinement": snap_yaml["confinement"],
                "interfaces": [
                    {
                        "name": name,
                        "interface": plug.get("interface", name),
                        # "description": "TODO",
                        # "raw_yaml": "TODO",
                        # "categories": ["TODO"],
                        # "auto_connect": False,
                        # "details": ["TODO"]
                    }
                    for name, plug in snap_yaml.get("plugs", {}).items()
                ],
            },
        }
    except Exception as e:
        res = {"success": True if details else False, "errors": [str(e)]}

    response = make_response(res, 200)
    response.cache_control.max_age = 0 if not res.get("success") else 3600
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
