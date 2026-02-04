# Packages
import flask
from flask import make_response
from canonicalwebteam.exceptions import (
    StoreApiResponseErrorList,
)
from canonicalwebteam.store_api.dashboard import Dashboard
from canonicalwebteam.store_api.publishergw import PublisherGW
from flask.json import jsonify
import logging

# Local
from webapp.decorators import login_required, exchange_required
from webapp.helpers import api_publisher_session, api_session, get_brand_id
from webapp.ratings import RatingsClient
from cache.cache_utility import redis_cache

logger = logging.getLogger(__name__)

dashboard = Dashboard(api_session)
publisher_gateway = PublisherGW("snap", api_publisher_session)

ratings_client = None


def get_ratings_client():
    global ratings_client
    if ratings_client is None:
        ratings_url = flask.current_app.config.get("RATINGS_SERVICE_URL")
        if ratings_url:
            ratings_client = RatingsClient(ratings_url)
    return ratings_client


endpoints = flask.Blueprint(
    "endpoints",
    __name__,
)


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


@endpoints.route("/api/snap/<snap_id>/ratings")
def get_snap_ratings(snap_id):
    """
    Get ratings for a snap by snap_id.
    """
    if not snap_id:
        return jsonify({"error": "snap_id is required"}), 400

    cache_key = f"snap_ratings:{snap_id}"
    cached_ratings = redis_cache.get(cache_key)
    if cached_ratings is not None:
        return cached_ratings, 200

    try:
        ratings_client = get_ratings_client()
        if not ratings_client:
            return jsonify(None), 200

        ratings_data = ratings_client.get_snap_rating(snap_id)

        if (
            ratings_data
            and ratings_data.get("ratings_band") == "insufficient-votes"
        ):
            redis_cache.set(cache_key, None, ttl=86400)
            return jsonify(None), 200

        if ratings_data:
            redis_cache.set(cache_key, ratings_data, ttl=86400)

        return jsonify(ratings_data), 200
    except Exception as e:
        logger.error(f"Error fetching ratings for snap {snap_id}: {e}")
        return jsonify(None), 200
