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
            "featured_snaps": [
                {
                    "origin": "canonical",
                    "package_name": "ubuntu-core",
                    "title": "ubuntu-core",
                    "icon_url": (
                        "https://dashboard.snapcraft.io/site_media/appmedia/"
                        + "2015/12/logo-ubuntu_cof-orange-hex_2.png"
                    ),
                    "summary": "The ubuntu-core OS snap",
                    "description": "no description",
                    "background": "#2c001e",
                },
                {
                    "origin": "canonical",
                    "package_name": "docker",
                    "title": "Docker",
                    "icon_url": (
                        "https://dashboard.snapcraft.io/site_media/appmedia/2"
                        + "018/12/6fbb3483-snapcraft-default-snap-icon.svg.png"
                    ),
                    "summary": "Docker container runtime",
                    "description": (
                        "Build and run container images with Docker."
                    ),
                    "background": "#0069d9",
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

    @store.route("/publisher/kde")
    def publisher_details_kde():
        """
        A view to display the publisher details page for specific publisher.
        """

        context = {
            "icon_url": "https://assets.ubuntu.com/v1/"
            + "98a86926-logo-white-blue-source.svg",
            # "banner_url": (
            #     "https://assets.ubuntu.com/v1/f43b5e66-mwc17-partners-hero.jpg"
            # ),
            "publisher": "KDE",
            "username": "kde",
            "summary": "TODO: KDE summary",
            "description": (
                "<p>Helping build a world in which everyone has control over"
                + " their digital life and enjoys freedom and privacy.</p>"
            ),
            "publisher_since": "??? March 2016",
            "snaps_count": 10,
            "snaps": [
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/256-apps-qupzilla.png",
                    "origin": "kde",
                    "package_name": "falkon",
                    "publisher": "KDE",
                    "summary": "Web Browser",
                    "title": "Falkon",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/kmines.png",
                    "origin": "kde",
                    "package_name": "kmines",
                    "publisher": "KDE",
                    "summary": "Minesweeper-like Game",
                    "title": "kmines",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kmag",
                    "publisher": "KDE",
                    "summary": "A screen magnification tool",
                    "title": "kmag",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "lokalize",
                    "publisher": "KDE",
                    "summary": "Computer-aided translation system",
                    "title": "lokalize",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2019/01/krdc.svg.png",
                    "origin": "kde",
                    "package_name": "krdc",
                    "publisher": "KDE",
                    "summary": "Remote Desktop Connection client",
                    "title": "krdc",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2018/11/icon_21.png",
                    "origin": "kde",
                    "package_name": "kde-frameworks-5-core18",
                    "publisher": "KDE",
                    "summary": "KDE Frameworks 5",
                    "title": "kde-frameworks-5-core18",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kiriki",
                    "publisher": "KDE",
                    "summary": "Yahtzee-like Dice Game",
                    "title": "kiriki",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2019/01/palapeli_9eQYMiV.png",
                    "origin": "kde",
                    "package_name": "palapeli",
                    "publisher": "KDE",
                    "summary": "Jigsaw puzzle game",
                    "title": "palapeli",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kteatime",
                    "publisher": "KDE",
                    "summary": "Tea Cooker",
                    "title": "kteatime",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/02/icon.png",
                    "origin": "kde",
                    "package_name": "okular",
                    "publisher": "KDE",
                    "summary": "Document Viewer",
                    "title": "Okular",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2019/01/icon.svg_uB08EBP.png",
                    "origin": "kde",
                    "package_name": "skrooge",
                    "publisher": "KDE",
                    "summary": "Skrooge is a personal finances manager powered by KDE",
                    "title": "Skrooge",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/granatier.svg.png",
                    "origin": "kde",
                    "package_name": "granatier",
                    "publisher": "KDE",
                    "summary": "Bomberman clone",
                    "title": "granatier",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kshisen",
                    "publisher": "KDE",
                    "summary": "Shisen-Sho Mahjongg-like Tile Game",
                    "title": "kshisen",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "rocs",
                    "publisher": "KDE",
                    "summary": "Graph Theory Tool for Professors and Students.",
                    "title": "rocs",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "ksirk",
                    "publisher": "KDE",
                    "summary": "Risk strategy game",
                    "title": "ksirk",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2016/10/kblocks.svg.png",
                    "origin": "kde",
                    "package_name": "kblocks",
                    "publisher": "KDE",
                    "summary": "Falling Blocks Game",
                    "title": "kblocks",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2019/01/kalgebra.svg.png",
                    "origin": "kde",
                    "package_name": "kalgebra",
                    "publisher": "KDE",
                    "summary": "algebraic graphing calculator",
                    "title": "KAlgebra",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2018/12/preferences-desktop-theme.svg.png",
                    "origin": "kde",
                    "package_name": "kirigami-gallery",
                    "publisher": "KDE",
                    "summary": "Shows examples of Kirigami components and allows you to play with them",
                    "title": "kirigami-gallery",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kgoldrunner",
                    "publisher": "KDE",
                    "summary": "A game of action and puzzle-solving",
                    "title": "kgoldrunner",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kfourinline",
                    "publisher": "KDE",
                    "summary": "Connect Four game",
                    "title": "kfourinline",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "klickety",
                    "publisher": "KDE",
                    "summary": "SameGame puzzle game",
                    "title": "klickety",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "konquest",
                    "publisher": "KDE",
                    "summary": "Galactic Strategy Game",
                    "title": "konquest",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/01/ktuberling.png",
                    "origin": "kde",
                    "package_name": "ktuberling",
                    "publisher": "KDE",
                    "summary": "A simple constructor game suitable for children and adults alike",
                    "title": "ktuberling",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kbounce",
                    "publisher": "KDE",
                    "summary": "Jezzball arcade game",
                    "title": "kbounce",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/bomber.svg.png",
                    "origin": "kde",
                    "package_name": "bomber",
                    "publisher": "KDE",
                    "summary": "Arcade Bombing Game",
                    "title": "bomber",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/kanagramicon.png",
                    "origin": "kde",
                    "package_name": "kanagram",
                    "publisher": "KDE",
                    "summary": "KDE Letter Order Game",
                    "title": "kanagram",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2016/10/icon_21.png",
                    "origin": "kde",
                    "package_name": "kde-frameworks-5",
                    "publisher": "KDE",
                    "summary": "KDE Frameworks 5",
                    "title": "kde-frameworks-5",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/step.svg.png",
                    "origin": "kde",
                    "package_name": "step",
                    "publisher": "KDE",
                    "summary": "Simulate physics experiments",
                    "title": "step",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kwordquiz",
                    "publisher": "KDE",
                    "summary": "A flashcard and vocabulary learning program",
                    "title": "kwordquiz",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/01/icon_20.png",
                    "origin": "kde",
                    "package_name": "katomic",
                    "publisher": "KDE",
                    "summary": "Sokoban-like Logic Game",
                    "title": "katomic",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kalzium",
                    "publisher": "KDE",
                    "summary": "KDE Periodic Table of Elements",
                    "title": "kalzium",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "spectacle",
                    "publisher": "KDE",
                    "summary": "Screenshot capture utility, replaces KSnapshot",
                    "title": "spectacle",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kwave",
                    "publisher": "KDE",
                    "summary": "Kwave is a sound editor built on KDE Frameworks 5",
                    "title": "kwave",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "killbots",
                    "publisher": "KDE",
                    "summary": "port of the classic BSD console game robots",
                    "title": "killbots",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/01/icon_22.png",
                    "origin": "kde",
                    "package_name": "konversation",
                    "publisher": "KDE",
                    "summary": "IRC client",
                    "title": "konversation",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2019/01/kpat.svg.png",
                    "origin": "kde",
                    "package_name": "kpat",
                    "publisher": "KDE",
                    "summary": "Solitaire card game",
                    "title": "KPatience",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kiten",
                    "publisher": "KDE",
                    "summary": "Japanese Reference and Study Tool",
                    "title": "kiten",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "dragon",
                    "publisher": "KDE",
                    "summary": "simple video player",
                    "title": "dragon",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "knavalbattle",
                    "publisher": "KDE",
                    "summary": "battleship board game",
                    "title": "knavalbattle",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kdf",
                    "publisher": "KDE",
                    "summary": "disk information utility",
                    "title": "kdf",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "yakuake",
                    "publisher": "KDE",
                    "summary": "Quake-style terminal emulator based on KDE Konsole technology",
                    "title": "yakuake",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/01/icon_21.png",
                    "origin": "kde",
                    "package_name": "kbruch",
                    "publisher": "KDE",
                    "summary": "Exercise Fractions",
                    "title": "KBruch",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/blinken.svg.png",
                    "origin": "kde",
                    "package_name": "blinken",
                    "publisher": "KDE",
                    "summary": "Memory Enhancement Game",
                    "title": "blinken",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2019/01/hisc-apps-kturtle.svg.png",
                    "origin": "kde",
                    "package_name": "kturtle",
                    "publisher": "KDE",
                    "summary": "Educational Programming Environment",
                    "title": "KTurtle",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/01/icon_13.png",
                    "origin": "kde",
                    "package_name": "kruler",
                    "publisher": "KDE",
                    "summary": "Screen Ruler",
                    "title": "kruler",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kmousetool",
                    "publisher": "KDE",
                    "summary": "mouse manipulation tool for the disabled",
                    "title": "kmousetool",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2018/11/Mascot_konqi-app-dev.png",
                    "origin": "kde",
                    "package_name": "kde-frameworks-5-core18-sdk",
                    "publisher": "KDE",
                    "summary": "KDE Frameworks 5",
                    "title": "kde-frameworks-5-core18-sdk",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/picmi.svg.png",
                    "origin": "kde",
                    "package_name": "picmi",
                    "publisher": "KDE",
                    "summary": "Puzzle game based on number logic",
                    "title": "picmi",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/kbreakout.svg.png",
                    "origin": "kde",
                    "package_name": "kbreakout",
                    "publisher": "KDE",
                    "summary": "ball and paddle game",
                    "title": "kbreakout",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/09/icon.svg_OIyMATB.png",
                    "origin": "kde",
                    "package_name": "massif-visualizer",
                    "publisher": "KDE",
                    "summary": "Tool for visualizing memory usage recorded by Valgrind Massif",
                    "title": "massif-visualizer",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2019/01/umbrello.svg.png",
                    "origin": "kde",
                    "package_name": "umbrello",
                    "publisher": "KDE",
                    "summary": "UML modelling tool and code generator",
                    "title": "Umbrello",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/09/icon.svg_mPJC3ZK.png",
                    "origin": "kde",
                    "package_name": "labplot",
                    "publisher": "KDE",
                    "summary": "interactive graphing and analysis of scientific data",
                    "title": "labplot",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/01/icon_14.png",
                    "origin": "kde",
                    "package_name": "ktouch",
                    "publisher": "KDE",
                    "summary": "Touch Typing Tutor",
                    "title": "KTouch",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/kate.svg.png",
                    "origin": "kde",
                    "package_name": "kate",
                    "publisher": "KDE",
                    "summary": "KDE Advanced Text Editor",
                    "title": "kate",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/ksquares.png",
                    "origin": "kde",
                    "package_name": "ksquares",
                    "publisher": "KDE",
                    "summary": "Connect the dots to create squares",
                    "title": "ksquares",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kompare",
                    "publisher": "KDE",
                    "summary": "Diff/Patch Frontend",
                    "title": "kompare",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/01/kollision.png",
                    "origin": "kde",
                    "package_name": "kollision",
                    "publisher": "KDE",
                    "summary": "Casual ball game",
                    "title": "kollision",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/kblackbox.png",
                    "origin": "kde",
                    "package_name": "kblackbox",
                    "publisher": "KDE",
                    "summary": "Blackbox Logic Game",
                    "title": "kblackbox",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kreversi",
                    "publisher": "KDE",
                    "summary": "Reversi Board Game",
                    "title": "kreversi",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "klines",
                    "publisher": "KDE",
                    "summary": "color lines game",
                    "title": "klines",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "parley",
                    "publisher": "KDE",
                    "summary": "vocabulary trainer",
                    "title": "parley",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kstars",
                    "publisher": "KDE",
                    "summary": "KStars is a desktop planetarium for amateur and professional astronomers.",
                    "title": "kstars",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/ark.png",
                    "origin": "kde",
                    "package_name": "ark",
                    "publisher": "KDE",
                    "summary": "Work with file archives",
                    "title": "ark",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "knetwalk",
                    "publisher": "KDE",
                    "summary": "wire puzzle game",
                    "title": "knetwalk",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "sweeper",
                    "publisher": "KDE",
                    "summary": "history and temporary file cleaner",
                    "title": "sweeper",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kdiamond",
                    "publisher": "KDE",
                    "summary": "three-in-a-row game",
                    "title": "kdiamond",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2018/11/sc-apps-peruse.svg.png",
                    "origin": "kde",
                    "package_name": "peruse",
                    "publisher": "KDE",
                    "summary": "Comic Book Reader",
                    "title": "peruse",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kigo",
                    "publisher": "KDE",
                    "summary": "Go Board Game",
                    "title": "kigo",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/okteta.svg.png",
                    "origin": "kde",
                    "package_name": "okteta",
                    "publisher": "KDE",
                    "summary": "Hex editor",
                    "title": "okteta",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "klettres",
                    "publisher": "KDE",
                    "summary": "a KDE program to learn the alphabet",
                    "title": "klettres",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/bovo.png",
                    "origin": "kde",
                    "package_name": "bovo",
                    "publisher": "KDE",
                    "summary": '"Five in a row" board game',
                    "title": "bovo",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kspaceduel",
                    "publisher": "KDE",
                    "summary": "Space Arcade Game",
                    "title": "kspaceduel",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/01/icon_16.png",
                    "origin": "kde",
                    "package_name": "kgeography",
                    "publisher": "KDE",
                    "summary": "A Geography Learning Program",
                    "title": "kgeography",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/gwenview.svg.png",
                    "origin": "kde",
                    "package_name": "gwenview",
                    "publisher": "KDE",
                    "summary": "A simple image viewer",
                    "title": "gwenview",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kig",
                    "publisher": "KDE",
                    "summary": "Explore Geometric Constructions",
                    "title": "kig",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kubrick",
                    "publisher": "KDE",
                    "summary": "A 3-D game based on Rubik\u0027s Cube",
                    "title": "kubrick",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "ksudoku",
                    "publisher": "KDE",
                    "summary": "KSudoku, Sudoku game \u0026 more by KDE",
                    "title": "ksudoku",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kmahjongg",
                    "publisher": "KDE",
                    "summary": "mahjongg solitaire game",
                    "title": "kmahjongg",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/kapman.png",
                    "origin": "kde",
                    "package_name": "kapman",
                    "publisher": "KDE",
                    "summary": "Eat pills escaping ghosts",
                    "title": "kapman",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "skanlite",
                    "publisher": "KDE",
                    "summary": "image scanner based on the KSane backend",
                    "title": "skanlite",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/01/icon_30.png",
                    "origin": "kde",
                    "package_name": "kcalc",
                    "publisher": "KDE",
                    "summary": "Scientific Calculator",
                    "title": "KCalc",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/01/icon_15.png",
                    "origin": "kde",
                    "package_name": "kmplot",
                    "publisher": "KDE",
                    "summary": "Mathematical Function Plotter",
                    "title": "kmplot",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "ktimer",
                    "publisher": "KDE",
                    "summary": "countdown timer",
                    "title": "ktimer",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kcolorchooser",
                    "publisher": "KDE",
                    "summary": "color chooser and palette editor",
                    "title": "kcolorchooser",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2019/01/kolourpaint.svg.png",
                    "origin": "kde",
                    "package_name": "kolourpaint",
                    "publisher": "KDE",
                    "summary": "An easy-to-use paint program",
                    "title": "kolourpaint",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "kjumpingcube",
                    "publisher": "KDE",
                    "summary": "simple tactical game",
                    "title": "kjumpingcube",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/artikulate.svg.png",
                    "origin": "kde",
                    "package_name": "artikulate",
                    "publisher": "KDE",
                    "summary": "Artikulate Pronunciation Trainer",
                    "title": "artikulate",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "cervisia",
                    "publisher": "KDE",
                    "summary": "graphical CVS client",
                    "title": "cervisia",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2017/10/cantor.svg.png",
                    "origin": "kde",
                    "package_name": "cantor",
                    "publisher": "KDE",
                    "summary": "KDE Frontend to Mathematical Software",
                    "title": "cantor",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "minuet",
                    "publisher": "KDE",
                    "summary": "Music Education Software",
                    "title": "minuet",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "ksnakeduel",
                    "publisher": "KDE",
                    "summary": "Tron-like Game",
                    "title": "ksnakeduel",
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "",
                    "origin": "kde",
                    "package_name": "xdg-portal-test-kde",
                    "publisher": "KDE",
                    "summary": "xdg-portal-test-kde",
                    "title": "xdg-portal-test-kde",
                },
            ],
            "featured_snaps": [
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2019/01/umbrello.svg.png",
                    "origin": "kde",
                    "package_name": "umbrello",
                    "publisher": "KDE",
                    "summary": "UML modelling tool and code generator",
                    "description": "A Unified Modelling Language diagram editor for KDE. It can create diagrams of software and other systems in the industry-standard UML format, and can also generate code from UML diagrams in a variety of programming languages.",
                    "title": "Umbrello",
                    "background": "#3d3532"
                },
                {
                    "developer_validation": "verified",
                    "icon_url": "https://dashboard.snapcraft.io/site_media/appmedia/2019/01/krdc.svg.png",
                    "origin": "kde",
                    "package_name": "krdc",
                    "publisher": "KDE",
                    "summary": "Remote Desktop Connection client",
                    "description": "The KDE Remote Desktop Connection client can view and control a desktop session running on another system. It can connect to Windows Terminal Servers using RDP and many other platforms using VNC/RFB.",
                    "title": "krdc",
                    "background": "#134732"
                },
            ],
            "website": "https://www.kde.org/",
            "contact":
            "https://bugs.kde.org/enter_bug.cgi?product=neon&component=Snaps",
            "developer_validation": "verified",
            # "blog_slug": "skype",
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
