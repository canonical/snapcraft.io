from math import ceil, floor
import talisker.requests
import flask
from dateutil import parser
import webapp.helpers as helpers
import webapp.store.logic as logic
from webapp.api import requests
from canonicalwebteam.store_api.stores.snapstore import SnapStore
from canonicalwebteam.store_api.exceptions import StoreApiError
from webapp.api.exceptions import ApiError
from webapp.snapcraft import logic as snapcraft_logic
from webapp.store.snap_details_views import snap_details_views
import os
from pprint import pprint

session = talisker.requests.get_session(requests.Session)

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")


def store_blueprint(store_query=None):
    api = SnapStore(session, store_query)

    store = flask.Blueprint(
        "store",
        __name__,
        template_folder="/templates",
        static_folder="/static",
    )
    snap_details_views(store, api)

    @store.route("/discover")
    def discover():
        return flask.redirect(flask.url_for(".homepage"))

    def store_view():
        error_info = {}
        status_code = 200

        try:
            categories_results = api.get_categories()
        except StoreApiError:
            categories_results = []

        categories = logic.get_categories(categories_results)

        featured_snaps = api.get_featured_items()["results"]

        if not featured_snaps:
            return flask.abort(503)

        for snap in featured_snaps:
            snap["icon_url"] = helpers.get_icon(snap["media"])

        # if the first snap (banner snap) doesn't have an icon, remove the last
        # snap from the list to avoid a hanging snap (grid of 9)
        if len(featured_snaps) == 10 and featured_snaps[0]["icon_url"] == "":
            featured_snaps = featured_snaps[:-1]

        for index in range(len(featured_snaps)):
            featured_snaps[index] = logic.get_snap_banner_url(
                featured_snaps[index]
            )

        livestream = snapcraft_logic.get_livestreams()

        return (
            flask.render_template(
                "store/store.html",
                categories=categories,
                has_featured=True,
                featured_snaps=featured_snaps,
                error_info=error_info,
                livestream=livestream,
            ),
            status_code,
        )

    def brand_store_view():
        error_info = {}
        status_code = 200

        try:
            snaps = api.get_all_items(size=16)["results"]
        except (StoreApiError, ApiError):
            snaps = []

        for snap in snaps:
            snap["icon_url"] = helpers.get_icon(snap["media"])

        return (
            flask.render_template(
                "brand-store/store.html", snaps=snaps, error_info=error_info
            ),
            status_code,
        )

    def search_snap():
        snap_searched = flask.request.args.get("q", default="", type=str)
        snap_category = flask.request.args.get(
            "category", default="", type=str
        )
        page = flask.request.args.get("page", default=1, type=int)

        if snap_category:
            snap_category_display = snap_category.capitalize().replace(
                "-", " "
            )
        else:
            snap_category_display = None

        if not snap_searched and not snap_category:
            return flask.redirect(flask.url_for(".homepage"))

        # The default size is 44
        # (11 rows of 4) - on search results pages
        # or (1 + 5 rows of 3 + 7 rows of 4) - on category page 1

        size = 44

        publishers = {
            "jetbrains": "28zEonXNoBLvIB7xneRbltOsp0Nf7DwS",
            "kde": "2rsYZu6kqYVFsSejExu4YENdXQEO40Xb",
            "snapcrafters": "eEoV9TnaNkCzfJBu9SRhr2678vzyYV43",
        }

        display_query = snap_searched

        if "publisher:jetbrains" in snap_searched:
            snap_searched = f'publisher:{publishers["jetbrains"]}'
            display_query = "publisher:jetbrains"

        if "publisher:kde" in snap_searched:
            snap_searched = f'publisher:{publishers["kde"]}'
            display_query = "publisher:kde"

        if "publisher:snapcrafters" in snap_searched:
            snap_searched = f'publisher:{publishers["snapcrafters"]}'
            display_query = "publisher:snapcrafters"

        searched_results = api.search(
            snap_searched,
            category=snap_category,
            size=size,
            page=page,
        )

        total_pages = None

        if "total" in searched_results:
            total_results_count = searched_results["total"]
            total_pages = ceil(total_results_count / size)
        else:
            total_results_count = None

        snaps_results = searched_results["results"]

        for snap in snaps_results:
            snap["icon_url"] = helpers.get_icon(snap["media"])

        links = {}

        if page > 1:
            links["first"] = logic.build_pagination_link(
                snap_searched=snap_searched,
                snap_category=snap_category,
                page=1,
            )
            links["prev"] = logic.build_pagination_link(
                snap_searched=snap_searched,
                snap_category=snap_category,
                page=page - 1,
            )

        if not total_pages or page < total_pages:
            links["next"] = logic.build_pagination_link(
                snap_searched=snap_searched,
                snap_category=snap_category,
                page=page + 1,
            )
            if total_pages:
                links["last"] = logic.build_pagination_link(
                    snap_searched=snap_searched,
                    snap_category=snap_category,
                    page=total_pages,
                )

        featured_snaps = []

        # These are the hand-selected "featured snaps" in each category.
        # We don't have this information on the API, so it's hardcoded.
        number_of_featured_snaps = 16

        if snap_category_display and page == 1:
            if snaps_results and snaps_results[0]:
                if snaps_results[0]["icon_url"] == "":
                    snaps_results = logic.promote_snap_with_icon(snaps_results)

                snaps_results[0] = logic.get_snap_banner_url(snaps_results[0])

                if (
                    snap_category == "featured"
                    or len(snaps_results) < number_of_featured_snaps
                ):
                    featured_snaps = snaps_results
                    snaps_results = []
                else:
                    featured_snaps = snaps_results[:number_of_featured_snaps]
                    snaps_results = snaps_results[number_of_featured_snaps:]

        context = {
            "query": snap_searched,
            "category": snap_category,
            "category_display": snap_category_display,
            "searched_snaps": snaps_results,
            "featured_snaps": featured_snaps,
            "total": total_results_count,
            "links": links,
            "page": page,
            "display_query": display_query,
        }

        return flask.render_template("store/search.html", **context)

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

    @store.route("/youtube/<video_id>")
    def get_video_thumbnail_data(video_id):
        thumbnail_url = "https://www.googleapis.com/youtube/v3/videos"
        thumbnail_data = session.get(
            f"{thumbnail_url}?id={video_id}&part=snippet&key={YOUTUBE_API_KEY}"
        )

        if thumbnail_data:
            return thumbnail_data.json()

        return {}

    @store.route("/publisher/<regex('[a-z0-9-]*[a-z][a-z0-9-]*'):publisher>")
    def publisher_details(publisher):
        """
        A view to display the publisher details page for specific publisher.
        """

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
        store.add_url_rule("/search", "search", search_snap)

    return store
