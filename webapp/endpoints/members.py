# Packages
import json
import flask
from flask.json import jsonify
from canonicalwebteam.exceptions import (
    StoreApiResponseErrorList,
)
from canonicalwebteam.store_api.dashboard import Dashboard

# Local
from webapp.decorators import login_required, exchange_required
from webapp.helpers import api_session
from cache.cache_utility import redis_cache


dashboard = Dashboard(api_session)

members = flask.Blueprint(
    "members",
    __name__,
)


@members.route("/api/store/<store_id>/members")
@login_required
@exchange_required
def get_manage_members(store_id):
    cached_store_members_key = f"{store_id}:store_members"
    cached_members = redis_cache.get(
        cached_store_members_key, expected_type=list
    )
    if cached_members is not None:
        members = cached_members
    else:
        members = dashboard.get_store_members(flask.session, store_id)
        redis_cache.set(cached_store_members_key, members, ttl=3600)

    for item in members:
        if item["email"] == flask.session["publisher"]["email"]:
            item["current_user"] = True

    return jsonify(members)


@members.route("/api/store/<store_id>/members", methods=["POST"])
@login_required
@exchange_required
def post_manage_members(store_id):
    members = json.loads(flask.request.form.get("members"))
    res = {}

    try:
        dashboard.update_store_members(flask.session, store_id, members)
        res["msg"] = "Changes saved"
        cached_store_members_key = f"{store_id}:store_members"
        redis_cache.delete(cached_store_members_key)
    except StoreApiResponseErrorList as api_response_error_list:
        codes = [error.get("code") for error in api_response_error_list.errors]

        msgs = [
            f"{error.get('message', 'An error occurred')}"
            for error in api_response_error_list.errors
        ]

        for code in codes:
            account_id = ""

            if code == "store-users-no-match":
                if account_id:
                    res["msg"] = code
                else:
                    res["msg"] = "invite"

            elif code == "store-users-multiple-matches":
                res["msg"] = code
            else:
                for msg in msgs:
                    flask.flash(msg, "negative")

    return jsonify(res)
