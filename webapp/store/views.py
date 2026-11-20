from functools import partial
import logging
from math import floor
from operator import methodcaller
from urllib.parse import urlencode

import requests as api_requests
import flask
from dateutil import parser
from webapp.decorators import exchange_required, login_required
import webapp.helpers as helpers
import webapp.store.logic as logic
from webapp.api import requests

from canonicalwebteam.exceptions import StoreApiError
from canonicalwebteam.store_api.dashboard import Dashboard
from canonicalwebteam.store_api.publishergw import PublisherGW
from canonicalwebteam.store_api.devicegw import DeviceGW
from canonicalwebteam.snap_recommendations import SnapRecommendations

from webapp.api.exceptions import ApiError
from webapp.store.snap_details_views import snap_details_views
from webapp.store.concurrency import run_tasks
from webapp.helpers import api_publisher_session, api_session
from flask.json import jsonify
from webapp.extensions import csrf
from webapp.store.logic import (
    get_categories,
)
from cache.cache_utility import redis_cache

session = requests.Session()
recommendations_session = requests.RecommendationsSession()

dashboard = Dashboard(api_session)
publisher_gateway = PublisherGW("snap", api_publisher_session)
device_gateway = DeviceGW("snap", api_session)
snap_recommendations = SnapRecommendations(recommendations_session)
logger = logging.getLogger(__name__)


def _get_cached_recommendation(cache_key, fetch):
    try:
        recommendations = redis_cache.get(cache_key, expected_type=list)
        if recommendations is None:
            with requests.RecommendationsSession() as session:
                recommendations = fetch(SnapRecommendations(session))
            redis_cache.set(cache_key, recommendations, ttl=3600)
        return recommendations
    except (ApiError, api_requests.exceptions.RequestException):
        logger.warning(
            "Unable to load recommendations for %s",
            cache_key,
            exc_info=True,
        )
        return []


def _get_cached_categories():
    try:
        categories = redis_cache.get("explore:categories", expected_type=list)
        if categories is None:
            with requests.Session() as session:
                categories = DeviceGW("snap", session).get_categories()
            redis_cache.set("explore:categories", categories, ttl=3600)
        return categories
    except (StoreApiError, ApiError, api_requests.exceptions.RequestException):
        logger.warning("Unable to load store categories", exc_info=True)
        return []


def _get_featured_snaps(fields):
    try:
        with requests.Session() as session:
            device_gateway = DeviceGW("snap", session)
            return device_gateway.get_featured_snaps(fields=fields)
    except (StoreApiError, ApiError, api_requests.exceptions.RequestException):
        logger.warning("Unable to load featured snaps", exc_info=True)
        return {}


def store_blueprint(store_query=None):
    store = flask.Blueprint(
        "store",
        __name__,
        template_folder="/templates",
        static_folder="/static",
    )
    snap_details_views(store)

    @store.route("/validation-sets", defaults={"path": ""})
    @store.route("/validation-sets/<path:path>")
    @login_required
    def validation_sets(path):
        return flask.render_template("store/publisher.html")

    @store.route("/discover")
    def discover():
        return flask.redirect(flask.url_for(".homepage"))

    def brand_store_view():
        error_info = {}
        status_code = 200

        try:
            snaps = device_gateway.get_all_items(size=16)["results"]
        except (StoreApiError, ApiError):
            snaps = []

        for snap in snaps:
            if "media" in snap:
                snap["icon_url"] = helpers.get_icon(snap["media"])

        return (
            flask.render_template(
                "brand-store/store.html", snaps=snaps, error_info=error_info
            ),
            status_code,
        )

    def brand_search_snap():
        status_code = 200
        snap_searched = flask.request.args.get("q", default="", type=str)

        if not snap_searched:
            return flask.redirect(flask.url_for(".homepage"))

        size = flask.request.args.get("limit", default=25, type=int)
        offset = flask.request.args.get("offset", default=0, type=int)

        try:
            page = floor(offset / size) + 1
        except ZeroDivisionError:
            size = 10
            page = floor(offset / size) + 1

        error_info = {}
        searched_results = []

        searched_results = device_gateway.search(
            snap_searched, size=size, page=page
        )

        snaps_results = searched_results["results"]

        for snap in snaps_results:
            snap["icon_url"] = helpers.get_icon(snap["media"])

        links = logic.get_pages_details(
            flask.request.base_url,
            (
                searched_results["_links"]
                if "_links" in searched_results
                else []
            ),
        )

        context = {
            "query": snap_searched,
            "snaps": snaps_results,
            "links": links,
            "error_info": error_info,
        }

        return (
            flask.render_template("brand-store/search.html", **context),
            status_code,
        )

    @store.route("/search")
    def store_view():
        return flask.render_template("store/search.html")

    @store.route("/store")
    def explore_view():
        allowlisted_redirect_params = (
            "q",
            "categories",
            "page",
            "architecture",
        )
        redirect_query_items = []

        for key in allowlisted_redirect_params:
            for value in flask.request.args.getlist(key):
                redirect_query_items.append((key, value))

        if redirect_query_items:
            encoded_query = urlencode(redirect_query_items, doseq=True)
            return flask.redirect(
                f"{flask.url_for('.store_view')}?{encoded_query}"
            )

        recommendation_fetchers = {
            "popular": methodcaller("get_popular"),
            "recent": methodcaller("get_recent"),
            "trending": methodcaller("get_trending"),
            "top-rated": methodcaller("get_top_rated"),
        }
        featured_snaps_fields = ",".join(
            [
                "developer_validation",
                "media",
                "package_name",
                "publisher",
                "summary",
                "title",
            ]
        )
        recommendations = {
            name: redis_cache.get(f"explore:{name}-snaps", expected_type=list)
            for name in recommendation_fetchers
        }
        categories_results = redis_cache.get(
            "explore:categories", expected_type=list
        )
        tasks = {
            name: partial(
                _get_cached_recommendation,
                f"explore:{name}-snaps",
                fetch,
            )
            for name, fetch in recommendation_fetchers.items()
            if recommendations[name] is None
        }
        if categories_results is None:
            tasks["categories"] = _get_cached_categories
        tasks["featured"] = partial(_get_featured_snaps, featured_snaps_fields)
        results = run_tasks(tasks)
        for name in recommendation_fetchers:
            if recommendations[name] is None:
                recommendations[name] = results[name]
        if categories_results is None:
            categories_results = results["categories"]
        featured_snaps = results["featured"]

        popular_snaps = recommendations["popular"]
        recent_snaps = recommendations["recent"]
        trending_snaps = recommendations["trending"]
        top_rated_snaps = recommendations["top-rated"]

        categories = sorted(
            get_categories(categories_results),
            key=lambda category: category["slug"],
        )

        currently_featured_snaps = [
            {
                "details": {
                    "developer_validation": snap["developer_validation"],
                    "icon": helpers.get_icon(snap["media"]),
                    "publisher": snap["publisher"],
                    "name": snap["package_name"],
                    "summary": snap["summary"],
                    "title": snap["title"],
                }
            }
            for snap in featured_snaps.get("_embedded", {}).get(
                "clickindex:package", []
            )
        ]

        return flask.render_template(
            "store/index.html",
            categories=categories,
            popular_snaps=popular_snaps,
            recent_snaps=recent_snaps,
            trending_snaps=trending_snaps,
            top_rated_snaps=top_rated_snaps,
            featured_snaps=currently_featured_snaps,
        )

    def _render_custom_publisher_page(publisher, publisher_content):
        snaps_results = logic.get_publisher_snaps(device_gateway, publisher)
        snaps_by_name = {}
        all_public_snaps = []

        for snap in snaps_results:
            item = snap["snap"]
            item["package_name"] = snap["name"]
            item["icon_url"] = helpers.get_icon(item.get("media", []))
            snaps_by_name[snap["name"]] = item
            all_public_snaps.append(item)

        featured_snaps = logic.hydrate_featured_snaps(
            publisher_content.get("featured_snaps"),
            snaps_by_name,
        )
        featured_names = {
            featured_snap["package_name"] for featured_snap in featured_snaps
        }

        listed_snaps = publisher_content.get("listed_snaps") or []
        listed_snaps_configured = len(listed_snaps) > 0

        if listed_snaps_configured:
            listed_snap_names = [
                listed_snap["package_name"]
                for listed_snap in listed_snaps
                if isinstance(listed_snap, dict)
                and "package_name" in listed_snap
            ]

            listed_public_snaps = []
            listed_seen = set()
            for listed_snap_name in listed_snap_names:
                if listed_snap_name in listed_seen:
                    continue

                listed_seen.add(listed_snap_name)
                if listed_snap_name not in snaps_by_name:
                    continue

                if listed_snap_name in featured_names:
                    continue

                listed_public_snaps.append(snaps_by_name[listed_snap_name])

            snaps = listed_public_snaps
        else:
            snaps = [
                snap
                for snap in all_public_snaps
                if snap["package_name"] not in featured_names
            ]

        publisher_details = (
            all_public_snaps[0].get("publisher", {})
            if all_public_snaps
            else {}
        )

        context = {
            **publisher_content,
            "featured_snaps": featured_snaps,
            "snaps": snaps,
            "snaps_count": len(all_public_snaps),
            "publisher": publisher_content["display_name"],
            "username": publisher,
            "developer_validation": publisher_details.get("validation"),
            "listed_snaps_configured": listed_snaps_configured,
            "listed_snaps_unavailable": (
                listed_snaps_configured and len(snaps) == 0
            ),
            "show_all_snaps_link": listed_snaps_configured,
        }

        return flask.render_template("store/publisher-details.html", **context)

    def _render_default_publisher_page(publisher):
        # standard page for all community publishers
        status_code = 200
        snaps = []
        publisher_details = {"display-name": publisher, "username": publisher}

        snaps_results = device_gateway.find(
            publisher=publisher,
            fields=[
                "title",
                "summary",
                "media",
                "publisher",
            ],
        )["results"]

        for snap in snaps_results:
            item = snap["snap"]
            item["package_name"] = snap["name"]
            item["icon_url"] = helpers.get_icon(item["media"])
            snaps.append(item)

        if snaps:
            publisher_details = snaps[0]["publisher"]

        context = {
            "snaps": snaps,
            "snaps_count": len(snaps),
            "publisher": publisher_details,
        }

        return (
            flask.render_template(
                "store/community-publisher-details.html", **context
            ),
            status_code,
        )

    @store.route("/publisher/<regex('[a-z0-9-]*[a-z][a-z0-9-]*'):publisher>")
    def publisher_details(publisher):
        """
        A view to display the publisher details page for specific publisher.
        """

        # 404 for the snap-quarantine publisher
        if publisher == "snap-quarantine":
            flask.abort(404)

        custom_publisher_registry = flask.current_app.extensions.get(
            "publisher_pages_registry", {}
        )

        publisher_content = custom_publisher_registry.get(publisher)
        if publisher_content is not None:
            return _render_custom_publisher_page(publisher, publisher_content)

        return _render_default_publisher_page(publisher)

    @store.route("/store/categories/<category>")
    def store_category(category):
        status_code = 200
        error_info = {}
        snaps_results = []

        snaps_results = device_gateway.get_category_items(
            category=category, size=10, page=1
        )["results"]
        for snap in snaps_results:
            snap["icon_url"] = helpers.get_icon(snap["media"])

        # if the first snap (banner snap) doesn't have an icon, remove the last
        # snap from the list to avoid a hanging snap (grid of 9)
        if len(snaps_results) == 10 and snaps_results[0]["icon_url"] == "":
            snaps_results = snaps_results[:-1]

        for index in range(len(snaps_results)):
            snaps_results[index] = logic.get_snap_banner_url(
                snaps_results[index]
            )

        context = {
            "category": category,
            "has_featured": True,
            "snaps": snaps_results,
            "error_info": error_info,
        }

        return (
            flask.render_template("store/_category-partial.html", **context),
            status_code,
        )

    @store.route("/store/stats")
    def store_stats():
        try:
            stats = redis_cache.get("store:stats", expected_type=dict)
            if not stats:
                stats = snap_recommendations.get_stats()
                redis_cache.set("store:stats", stats, ttl=3600)
        except (ApiError, api_requests.exceptions.RequestException):
            return "", 204
        return flask.jsonify(stats)

    @store.route("/store/sitemap.xml")
    def sitemap():
        sitemap = redis_cache.get("sitemap:xml", expected_type=str)
        if sitemap:
            response = flask.make_response(sitemap)
            response.headers["Content-Type"] = "application/xml"
            response.headers["Cache-Control"] = "public, max-age=43200"
            return response

        base_url = "https://snapcraft.io/store"

        snaps = []
        page = 0
        url = f"https://api.snapcraft.io/api/v1/snaps/search?page={page}"
        while url:
            response = session.get(url)
            try:
                snaps_response = response.json()
            except Exception:
                continue

            for snap in snaps_response["_embedded"]["clickindex:package"]:
                try:
                    last_udpated = (
                        parser.parse(snap["last_updated"])
                        .replace(tzinfo=None)
                        .strftime("%Y-%m-%d")
                    )
                    snaps.append(
                        {
                            "url": "https://snapcraft.io/"
                            + snap["package_name"],
                            "last_udpated": last_udpated,
                        }
                    )
                except Exception:
                    continue
            if "next" in snaps_response["_links"]:
                url = snaps_response["_links"]["next"]["href"]
            else:
                url = None

        xml_sitemap = flask.render_template(
            "sitemap/sitemap.xml",
            base_url=base_url,
            links=snaps,
        )

        # Cache the generated sitemap for 12 hours
        redis_cache.set("sitemap:xml", xml_sitemap, ttl=43200)

        response = flask.make_response(xml_sitemap)
        response.headers["Content-Type"] = "application/xml"
        response.headers["Cache-Control"] = "public, max-age=43200"

        return response

    if store_query:
        store.add_url_rule("/", "homepage", brand_store_view)
        store.add_url_rule("/search", "search", brand_search_snap)
    else:
        store.add_url_rule("/store", "homepage", store_view)

    store.add_url_rule("/explore", "explore", explore_view)

    @store.route("/<snap_name>/create-track", methods=["POST"])
    @login_required
    @csrf.exempt
    @exchange_required
    def post_create_track(snap_name):
        track_name = flask.request.form["track-name"]
        version_pattern = flask.request.form.get("version-pattern")
        auto_phasing_percentage = flask.request.form.get(
            "automatic-phasing-percentage"
        )

        if auto_phasing_percentage is not None:
            auto_phasing_percentage = float(auto_phasing_percentage)

        response = publisher_gateway.create_track(
            flask.session,
            snap_name,
            track_name,
            version_pattern,
            auto_phasing_percentage,
        )
        if response.status_code == 201:
            return response.json(), response.status_code
        if response.status_code == 409:
            return (
                jsonify({"error": "Track already exists."}),
                response.status_code,
            )
        if "error-list" in response.json():
            return (
                jsonify(
                    {"error": response.json()["error-list"][0]["message"]}
                ),
                response.status_code,
            )
        return response.json(), response.status_code

    return store
