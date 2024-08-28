from math import floor
import talisker.requests
import flask
from dateutil import parser
from webapp.decorators import exchange_required, login_required
import webapp.helpers as helpers
import webapp.store.logic as logic
from webapp.api import requests
from canonicalwebteam.store_api.stores.snapstore import (
    SnapStore,
    SnapPublisher,
)
from canonicalwebteam.store_api.exceptions import StoreApiError
from webapp.api.exceptions import ApiError
from webapp.store.snap_details_views import snap_details_views
from webapp.helpers import api_publisher_session
from flask.json import jsonify
import os
from webapp.extensions import csrf

session = talisker.requests.get_session(requests.Session)

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
publisher_api = SnapPublisher(api_publisher_session)


def store_blueprint(store_query=None):
    api = SnapStore(session, store_query)

    store = flask.Blueprint(
        "store",
        __name__,
        template_folder="/templates",
        static_folder="/static",
    )
    snap_details_views(store, api)

    def format_validation_set(validation_set):
        return validation_set["headers"]

    @store.route("/api/validation-sets")
    @login_required
    def get_validation_sets():
        res = {}

        try:
            validation_sets = publisher_api.get_validation_sets(flask.session)
            res["success"] = True

            if len(validation_sets["assertions"]) > 0:
                res["data"] = [
                    format_validation_set(item)
                    for item in validation_sets["assertions"]
                ]
            else:
                res["data"] = []

            response = flask.make_response(res, 200)
            response.cache_control.max_age = "3600"
        except StoreApiError as error_list:
            error_messages = [
                f"{error.get('message', 'An error occurred')}"
                for error in error_list.errors
            ]

            res["message"] = " ".join(error_messages)
            res["success"] = False
            response = flask.make_response(res, 500)

        return response

    @store.route("/api/validation-sets/<validation_set_id>")
    @login_required
    def get_validation_set(validation_set_id):
        res = {}

        try:
            validation_set = publisher_api.get_validation_set(
                flask.session, validation_set_id
            )
            res["success"] = True

            if len(validation_set["assertions"]) > 0:
                res["data"] = [
                    format_validation_set(item)
                    for item in validation_set["assertions"]
                ]
            else:
                res["data"] = []

            response = flask.make_response(res, 200)
            response.cache_control.max_age = "3600"
        except StoreApiError as error_list:
            error_messages = [
                f"{error.get('message', 'An error occurred')}"
                for error in error_list.errors
            ]

            res["message"] = " ".join(error_messages)
            res["success"] = False
            response = flask.make_response(res, 500)

        return response

    @store.route("/validation-sets", defaults={"path": ""})
    @store.route("/validation-sets/<path:path>")
    @login_required
    def validation_sets(path):
        return flask.render_template("store/validation-sets.html")

    @store.route("/discover")
    def discover():
        return flask.redirect(flask.url_for(".homepage"))

    def brand_store_view():
        error_info = {}
        status_code = 200

        try:
            snaps = api.get_all_items(size=16)["results"]
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

        searched_results = api.search(snap_searched, size=size, page=page)

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

    @store.route("/store")
    def store_view():
        return flask.render_template("store/store.html")

    @store.route("/youtube", methods=["POST"])
    def get_video_thumbnail_data():
        body = flask.request.form
        thumbnail_url = "https://www.googleapis.com/youtube/v3/videos"
        thumbnail_data = session.get(
            (
                f"{thumbnail_url}?id={body['videoId']}"
                f"&part=snippet&key={YOUTUBE_API_KEY}"
            )
        )

        if thumbnail_data:
            return thumbnail_data.json()

        return {}

    @store.route("/publisher/<regex('[a-z0-9-]*[a-z][a-z0-9-]*'):publisher>")
    def publisher_details(publisher):
        """
        A view to display the publisher details page for specific publisher.
        """

        # 404 for the snap-quarantine publisher
        if publisher == "snap-quarantine":
            flask.abort(404)

        publisher_content_path = flask.current_app.config["CONTENT_DIRECTORY"][
            "PUBLISHER_PAGES"
        ]

        if publisher in ["kde", "snapcrafters", "jetbrains"]:
            context = helpers.get_yaml(
                publisher_content_path + publisher + ".yaml", typ="safe"
            )

            if not context:
                flask.abort(404)

            popular_snaps = helpers.get_yaml(
                publisher_content_path + publisher + "-snaps.yaml",
                typ="safe",
            )

            context["popular_snaps"] = (
                popular_snaps["snaps"] if popular_snaps else []
            )

            if "publishers" in context:
                context["snaps"] = []
                for publisher in context["publishers"]:
                    snaps_results = []
                    try:
                        snaps_results = api.get_publisher_items(
                            publisher, size=500, page=1
                        )["results"]
                    except StoreApiError:
                        pass

                    for snap in snaps_results:
                        snap["icon_url"] = helpers.get_icon(snap["media"])

                    context["snaps"].extend(
                        [snap for snap in snaps_results if snap["apps"]]
                    )

                featured_snaps = [
                    snap["package_name"] for snap in context["featured_snaps"]
                ]

                context["snaps"] = [
                    snap
                    for snap in context["snaps"]
                    if snap["package_name"] not in featured_snaps
                ]

                context["snaps_count"] = len(context["snaps"]) + len(
                    featured_snaps
                )

                return flask.render_template(
                    "store/publisher-details.html", **context
                )

        status_code = 200
        error_info = {}
        snaps_results = []
        snaps = []
        snaps_count = 0
        publisher_details = {"display-name": publisher, "username": publisher}

        snaps_results = api.find(
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

        snaps_count = len(snaps)

        if snaps_count > 0:
            publisher_details = snaps[0]["publisher"]

        context = {
            "snaps": snaps,
            "snaps_count": snaps_count,
            "publisher": publisher_details,
            "error_info": error_info,
        }

        return (
            flask.render_template(
                "store/community-publisher-details.html", **context
            ),
            status_code,
        )

    @store.route("/store/categories/<category>")
    def store_category(category):
        status_code = 200
        error_info = {}
        snaps_results = []

        snaps_results = api.get_category_items(
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

    @store.route("/store/featured-snaps/<category>")
    def featured_snaps_in_category(category):
        snaps_results = []

        snaps_results = api.get_category_items(
            category=category, size=3, page=1
        )["results"]

        for snap in snaps_results:
            snap["icon_url"] = helpers.get_icon(snap["media"])

        return flask.jsonify(snaps_results)

    @store.route("/store/sitemap.xml")
    def sitemap():
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

        response = flask.make_response(xml_sitemap)
        response.headers["Content-Type"] = "application/xml"
        response.headers["Cache-Control"] = "public, max-age=43200"

        return response

    if store_query:
        store.add_url_rule("/", "homepage", brand_store_view)
        store.add_url_rule("/search", "search", brand_search_snap)
    else:
        store.add_url_rule("/store", "homepage", store_view)

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

        response = publisher_api.create_track(
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
