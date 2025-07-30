# Packages
import flask
from flask import make_response
from canonicalwebteam.exceptions import (
    StoreApiResponseErrorList,
)
from canonicalwebteam.store_api.dashboard import Dashboard
from canonicalwebteam.store_api.publishergw import PublisherGW
from flask.json import jsonify

# Local
from webapp.decorators import login_required, exchange_required
from webapp.helpers import api_publisher_session, api_session


dashboard = Dashboard(api_session)
publisher_gateway = PublisherGW("snap", api_publisher_session)

endpoints = flask.Blueprint(
    "endpoints",
    __name__,
)


def get_brand_id(session, store_id):
    store = dashboard.get_store(session, store_id)
    return store["brand-id"]


@endpoints.route("/api/stores")
@login_required
@exchange_required
def get_stores():
    """
    In this view we get all the stores the user has access to or we show a 403
    """
    stores = dashboard.get_stores(flask.session)

    res = {"success": True, "data": stores}

    return jsonify(res)


@endpoints.route("/api/store/<store_id>")
@login_required
@exchange_required
def get_settings(store_id):
    store = dashboard.get_store(flask.session, store_id)
    store["links"] = []

    if any(role["role"] == "admin" for role in store["roles"]):
        store["links"].append(
            {"name": "Members", "path": f'/admin/{store["id"]}/members'}
        )
        store["links"].append(
            {"name": "Settings", "path": f'/admin/${store["id"]}/settings'}
        )

    res = {"success": True, "data": store}

    return jsonify(res)


@endpoints.route("/api/store/<store_id>/brand")
@login_required
@exchange_required
def get_brand_store(store_id: str):
    brand_id = get_brand_id(flask.session, store_id)
    res = {}
    try:
        brand = publisher_gateway.get_brand(flask.session, brand_id)

        res["data"] = brand
        res["success"] = True

    except StoreApiResponseErrorList as error_list:
        res["success"] = False
        res["message"] = " ".join(
            [
                f"{error.get('message', 'An error occurred')}"
                for error in error_list.errors
            ]
        )
        res["data"] = []

    response = make_response(res)
    response.cache_control.max_age = 3600

    return response
