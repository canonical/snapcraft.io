from math import floor
from urllib.parse import quote_plus

import flask

import webapp.store.logic as logic
from webapp.api.exceptions import (
    ApiCircuitBreaker,
    ApiConnectionError,
    ApiError,
    ApiResponseDecodeError,
    ApiResponseError,
    ApiResponseErrorList,
    ApiTimeoutError,
)
from webapp.api.store import StoreApi
from webapp.store.snap_details_views import snap_details_views


def store_blueprint(store_query=None, testing=False):
    api = StoreApi(store=store_query, testing=testing)

    store = flask.Blueprint(
        "store",
        __name__,
        template_folder="/templates",
        static_folder="/static",
    )

    def _handle_errors(api_error: ApiError):
        status_code = 502
        error = {"message": str(api_error)}

        if type(api_error) is ApiTimeoutError:
            status_code = 504
        elif type(api_error) is ApiResponseDecodeError:
            status_code = 502
        elif type(api_error) is ApiResponseErrorList:
            error["errors"] = api_error.errors
            status_code = 502
        elif type(api_error) is ApiResponseError:
            status_code = 502
        elif type(api_error) is ApiConnectionError:
            status_code = 502
        elif type(api_error) is ApiCircuitBreaker:
            # Special case for this one, because it is the only case where we
            # don't want the user to be able to access the page.
            return flask.abort(503)

        return status_code, error

    snap_details_views(store, api, _handle_errors)

    @store.route("/discover")
    def discover():
        return flask.redirect(flask.url_for(".homepage"))

    def store_view():
        error_info = {}
        status_code = 200

        try:
            categories_results = api.get_categories()
        except ApiError as api_error:
            categories_results = []
            status_code, error_info = _handle_errors(api_error)

        categories = logic.get_categories(categories_results)

        try:
            featured_snaps_results = api.get_searched_snaps(
                snap_searched="", category="featured", size=24, page=1
            )
        except ApiError:
            featured_snaps_results = []

        featured_snaps = logic.get_searched_snaps(featured_snaps_results)

        return (
            flask.render_template(
                "store/store.html",
                categories=categories,
                featured_snaps=featured_snaps,
                error_info=error_info,
            ),
            status_code,
        )

    def brand_store_view():
        error_info = {}
        status_code = 200

        try:
            snaps_results = api.get_all_snaps(size=12)
        except ApiError as api_error:
            snaps_results = []
            status_code, error_info = _handle_errors(api_error)

        snaps = logic.get_searched_snaps(snaps_results)

        return (
            flask.render_template(
                "brand-store/store.html", snaps=snaps, error_info=error_info
            ),
            status_code,
        )

    def search_snap():
        status_code = 200
        snap_searched = flask.request.args.get("q", default="", type=str)
        snap_category = flask.request.args.get(
            "category", default="", type=str
        )

        if snap_category:
            snap_category_display = snap_category.capitalize().replace(
                "-", " "
            )
        else:
            snap_category_display = None

        if not snap_searched and not snap_category:
            return flask.redirect(flask.url_for(".homepage"))

        size = flask.request.args.get("limit", default=24, type=int)
        offset = flask.request.args.get("offset", default=0, type=int)

        try:
            page = floor(offset / size) + 1
        except ZeroDivisionError:
            size = 10
            page = floor(offset / size) + 1

        error_info = {}
        categories_results = []
        searched_results = []

        try:
            categories_results = api.get_categories()
        except ApiError as api_error:
            status_code, error_info = _handle_errors(api_error)

        categories = logic.get_categories(categories_results)

        try:
            searched_results = api.get_searched_snaps(
                quote_plus(snap_searched),
                category=snap_category,
                size=size,
                page=page,
            )
        except ApiError as api_error:
            status_code, error_info = _handle_errors(api_error)

        if "total" in searched_results:
            total_results_count = searched_results["total"]
        else:
            total_results_count = None

        snaps_results = logic.get_searched_snaps(searched_results)
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
            "category": snap_category,
            "category_display": snap_category_display,
            "categories": categories,
            "snaps": snaps_results,
            "total": total_results_count,
            "links": links,
            "error_info": error_info,
        }

        return (
            flask.render_template("store/search.html", **context),
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

        try:
            searched_results = api.get_searched_snaps(
                quote_plus(snap_searched), size=size, page=page
            )
        except ApiError as api_error:
            status_code, error_info = _handle_errors(api_error)

        snaps_results = logic.get_searched_snaps(searched_results)
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

    # @store.route(
    #     '/publisher/<regex("[a-z0-9-]*[a-z][a-z0-9-]*"):publisher_name>'
    # )
    @store.route("/publisher/bartaz")
    def publisher_details_bartaz():
        """
        A view to display the publisher details page for specific publisher.
        """

        context = {
            "icon_url": (
                "https://www.gravatar.com/avatar/"
                + "3143c7995b1f1283f9b73c186f707f96"
            ),
            "publisher": "Bartek Szopka",
            "username": "bartaz",
            "summary": "He's awesome!",
            "description": "<p>He really is!</p>",
            "publisher_since": "March 2016",
            "snaps_count": 1,
            "snaps": [
                {
                    "origin": "bartaz",
                    "package_name": "speed-test",
                    "title": "Speed Test",
                }
            ],
            "website": "https://webteam.space",
        }

        return (
            flask.render_template("store/publisher-details.html", **context),
            200,
        )

    @store.route("/publisher/canonical")
    def publisher_details_canonical():
        """
        A view to display the publisher details page for specific publisher.
        """

        context = {
            "icon_url": (
                "https://assets.ubuntu.com/v1/b3b72cb2-canonical-logo-166.png"
            ),
            "banner_url": (
                "https://assets.ubuntu.com/v1/f43b5e66-mwc17-partners-hero.jpg"
            ),
            "publisher": "Canonical",
            "username": "canonical",
            "summary": "We are Canonical",
            "description": (
                "<p>It is our mission to make open source software available"
                + " to people everywhere.</p>"
                + "<p>We believe the best way to fuel innovation is to give"
                + " the innovators the technology they need.</p>"
                + "<p>Leading organisations all over the world turn to us for"
                + " our services and expertise – from systems management to"
                + " the deployment of Ubuntu on their own clouds, servers"
                + " and desktops.</p>"
            ),
            "publisher_since": "March 2016",
            "snaps_count": 10,
            "snaps": [
                {
                    "origin": "canonical",
                    "package_name": "canonical-livepatch",
                    "title": "canonical-livepatch",
                    "icon_url": (
                        "https://dashboard.snapcraft.io/site_media/appmedia/"
                        + "2016/08/pictogram-upgrade-orange-hex.svg.png"
                    ),
                },
                {
                    "origin": "canonical",
                    "package_name": "ubuntu-core",
                    "title": "ubuntu-core",
                    "icon_url": (
                        "https://dashboard.snapcraft.io/site_media/appmedia/"
                        + "2015/12/logo-ubuntu_cof-orange-hex_2.png"
                    ),
                },
                {
                    "origin": "canonical",
                    "package_name": "docker",
                    "title": "Docker",
                    "icon_url": (
                        "https://dashboard.snapcraft.io/site_media/appmedia/2"
                        + "018/12/6fbb3483-snapcraft-default-snap-icon.svg.png"
                    ),
                },
                {
                    "origin": "canonical",
                    "package_name": "canonical-livepatch",
                    "title": "canonical-livepatch",
                    "icon_url": (
                        "https://dashboard.snapcraft.io/site_media/appmedia/"
                        + "2016/08/pictogram-upgrade-orange-hex.svg.png"
                    ),
                },
                {
                    "origin": "canonical",
                    "package_name": "ubuntu-core",
                    "title": "ubuntu-core",
                    "icon_url": (
                        "https://dashboard.snapcraft.io/site_media/appmedia/"
                        + "2015/12/logo-ubuntu_cof-orange-hex_2.png"
                    ),
                },
                {
                    "origin": "canonical",
                    "package_name": "docker",
                    "title": "Docker",
                    "icon_url": (
                        "https://dashboard.snapcraft.io/site_media/appmedia/2"
                        + "018/12/6fbb3483-snapcraft-default-snap-icon.svg.png"
                    ),
                },
                {
                    "origin": "canonical",
                    "package_name": "canonical-livepatch",
                    "title": "canonical-livepatch",
                    "icon_url": (
                        "https://dashboard.snapcraft.io/site_media/appmedia/"
                        + "2016/08/pictogram-upgrade-orange-hex.svg.png"
                    ),
                },
                {
                    "origin": "canonical",
                    "package_name": "ubuntu-core",
                    "title": "ubuntu-core",
                    "icon_url": (
                        "https://dashboard.snapcraft.io/site_media/appmedia/"
                        + "2015/12/logo-ubuntu_cof-orange-hex_2.png"
                    ),
                },
                {
                    "origin": "canonical",
                    "package_name": "docker",
                    "title": "Docker",
                    "icon_url": (
                        "https://dashboard.snapcraft.io/site_media/appmedia/2"
                        + "018/12/6fbb3483-snapcraft-default-snap-icon.svg.png"
                    ),
                },
            ],
            "website": "https://canonical.com",
            "contact": "https://www.ubuntu.com/contact-us",
            "developer_validation": "verified",
            "blog_slug": "skype",
        }

        return (
            flask.render_template("store/publisher-details.html", **context),
            200,
        )

    @store.route("/store/categories/<category>")
    def store_category(category):
        status_code = 200
        error_info = {}
        category_results = []

        try:
            category_results = api.get_searched_snaps(
                snap_searched="", category=category, size=24, page=1
            )
        except ApiError as api_error:
            status_code, error_info = _handle_errors(api_error)

        snaps_results = logic.get_searched_snaps(category_results)

        context = {
            "category": category,
            "snaps": snaps_results,
            "error_info": error_info,
        }

        return (
            flask.render_template("store/_category-partial.html", **context),
            status_code,
        )

    if store_query:
        store.add_url_rule("/", "homepage", brand_store_view)
        store.add_url_rule("/search", "search", brand_search_snap)
    else:
        store.add_url_rule("/store", "homepage", store_view)
        store.add_url_rule("/search", "search", search_snap)

    return store
