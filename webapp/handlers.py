import socket
from urllib.parse import unquote, urlparse, urlunparse

import flask
from flask import render_template, request
import prometheus_client
import user_agents
import webapp.template_utils as template_utils
from canonicalwebteam import image_template
from webapp import authentication

from canonicalwebteam.store_api.exceptions import (
    StoreApiError,
    StoreApiConnectionError,
    StoreApiResourceNotFound,
    StoreApiResponseDecodeError,
    StoreApiResponseError,
    StoreApiResponseErrorList,
    StoreApiTimeoutError,
    PublisherAgreementNotSigned,
    PublisherMacaroonRefreshRequired,
    PublisherMissingUsername,
)

from webapp.api.exceptions import (
    ApiError,
    ApiConnectionError,
    ApiResponseErrorList,
    ApiTimeoutError,
    ApiResponseDecodeError,
    ApiResponseError,
)

from datetime import datetime

badge_counter = prometheus_client.Counter(
    "badge_counter", "A counter of badges requests"
)

badge_logged_in_counter = prometheus_client.Counter(
    "badge_logged_in_counter",
    "A counter of badges requests of logged in users",
)

accept_encoding_counter = prometheus_client.Counter(
    "accept_encoding_counter",
    "A counter for Accept-Encoding headers, split by browser",
    ["accept_encoding", "browser_family"],
)


def refresh_redirect(path):
    try:
        macaroon_discharge = authentication.get_refreshed_discharge(
            flask.session["macaroon_discharge"]
        )
    except ApiResponseError as api_response_error:
        if api_response_error.status_code == 401:
            return flask.redirect(flask.url_for("login.logout"))
        else:
            return flask.abort(502, str(api_response_error))
    except ApiError as api_error:
        return flask.abort(502, str(api_error))

    flask.session["macaroon_discharge"] = macaroon_discharge
    return flask.redirect(path)


def set_handlers(app):
    @app.context_processor
    def utility_processor():
        """
        This defines the set of properties and functions that will be added
        to the default context for processing templates. All these items
        can be used in all templates
        """

        if authentication.is_authenticated(flask.session):
            user_name = flask.session["publisher"]["fullname"]
            user_is_canonical = flask.session["publisher"].get(
                "is_canonical", False
            )
            stores = flask.session["publisher"].get("stores")
        else:
            user_name = None
            user_is_canonical = False
            stores = []

        page_slug = template_utils.generate_slug(flask.request.path)

        return {
            # Variables
            "LOGIN_URL": app.config["LOGIN_URL"],
            "SENTRY_DSN": app.config["SENTRY_DSN"],
            "COMMIT_ID": app.config["COMMIT_ID"],
            "ENVIRONMENT": app.config["ENVIRONMENT"],
            "host_url": flask.request.host_url,
            "path": flask.request.path,
            "page_slug": page_slug,
            "user_name": user_name,
            "VERIFIED_PUBLISHER": "verified",
            "STAR_DEVELOPER": "starred",
            "webapp_config": app.config["WEBAPP_CONFIG"],
            "BSI_URL": app.config["BSI_URL"],
            "now": datetime.now(),
            "user_is_canonical": user_is_canonical,
            # Functions
            "contains": template_utils.contains,
            "join": template_utils.join,
            "static_url": template_utils.static_url,
            "format_number": template_utils.format_number,
            "format_display_name": template_utils.format_display_name,
            "display_name": template_utils.display_name,
            "install_snippet": template_utils.install_snippet,
            "format_date": template_utils.format_date,
            "format_member_role": template_utils.format_member_role,
            "image": image_template,
            "stores": stores,
            "format_link": template_utils.format_link,
        }

    # Error handlers
    # ===
    @app.errorhandler(500)
    @app.errorhandler(501)
    @app.errorhandler(502)
    @app.errorhandler(504)
    @app.errorhandler(505)
    def internal_error(error):
        error_name = getattr(error, "name", type(error).__name__)
        return_code = getattr(error, "code", 500)

        supress_sentry = False
        if type(error).__name__ == "BadGateway":
            supress_sentry = True

        if not app.testing and not supress_sentry:
            app.extensions["sentry"].captureException()

        return (
            flask.render_template("50X.html", error_name=error_name),
            return_code,
        )

    @app.errorhandler(503)
    def service_unavailable(error):
        return render_template("503.html"), 503

    @app.errorhandler(404)
    @app.errorhandler(StoreApiResourceNotFound)
    def handle_resource_not_found(error):
        return render_template("404.html", message=str(error)), 404

    @app.errorhandler(ApiTimeoutError)
    @app.errorhandler(StoreApiTimeoutError)
    def handle_connection_timeout(error):
        status_code = 504
        return (
            render_template(
                "50X.html", error_message=str(error), status_code=status_code
            ),
            status_code,
        )

    @app.errorhandler(ApiResponseDecodeError)
    @app.errorhandler(ApiResponseError)
    @app.errorhandler(ApiConnectionError)
    @app.errorhandler(StoreApiResponseDecodeError)
    @app.errorhandler(StoreApiResponseError)
    @app.errorhandler(StoreApiConnectionError)
    @app.errorhandler(ApiError)
    @app.errorhandler(StoreApiError)
    def store_api_error(error):
        status_code = 502
        return (
            render_template(
                "50X.html", error_message=str(error), status_code=status_code
            ),
            status_code,
        )

    @app.errorhandler(ApiResponseErrorList)
    @app.errorhandler(StoreApiResponseErrorList)
    def handle_api_error_list(error):
        if error.status_code == 404:
            if "snap_name" in request.path:
                return flask.abort(404, "Snap not found!")
            else:
                return (
                    render_template("404.html", message="Entity not found"),
                    404,
                )
        if len(error.errors) == 1 and error.errors[0]["code"] in [
            "macaroon-permission-required",
            "macaroon-authorization-required",
        ]:
            last_login_method = flask.request.cookies.get("last_login_method")
            if last_login_method == "candid":
                login_path = "login-beta"
            else:
                login_path = "login"
            authentication.empty_session(flask.session)
            return flask.redirect(f"/{login_path}?next={flask.request.path}")

        status_code = 502
        codes = [
            f"{error['code']}: {error.get('message', 'No message')}"
            for error in error.errors
        ]

        error_msg = ", ".join(codes)
        return (
            render_template(
                "50X.html", error_message=error_msg, status_code=status_code
            ),
            status_code,
        )

    # Publisher error
    @app.errorhandler(PublisherMissingUsername)
    def handle_publisher_missing_name(error):
        return flask.redirect(flask.url_for("account.get_account_name"))

    @app.errorhandler(PublisherAgreementNotSigned)
    def handle_publisher_agreement_not_signed(error):
        return flask.redirect(flask.url_for("account.get_agreement"))

    @app.errorhandler(PublisherMacaroonRefreshRequired)
    def handle_publisher_macaroon_refresh_required(error):
        return refresh_redirect(flask.request.path)

    # Global tasks for all requests
    # ===
    @app.before_request
    def clear_trailing():
        """
        Remove trailing slashes from all routes
        We like our URLs without slashes
        """

        parsed_url = urlparse(unquote(flask.request.url))
        path = parsed_url.path

        if path != "/" and path.endswith("/"):
            new_uri = urlunparse(parsed_url._replace(path=path[:-1]))

            return flask.redirect(new_uri)

    @app.before_request
    def prometheus_metrics():
        # Accept-encoding counter
        # ===
        agent_string = flask.request.headers.get("User-Agent")

        # Exclude probes, which happen behind the cache
        if agent_string and not agent_string.startswith(
            ("kube-probe", "Prometheus")
        ):
            agent = user_agents.parse(agent_string or "")

            accept_encoding_counter.labels(
                accept_encoding=flask.request.headers.get("Accept-Encoding"),
                browser_family=agent.browser.family,
            ).inc()

        # Badge counters
        # ===
        if "/static/images/badges" in flask.request.url:
            if flask.session:
                badge_logged_in_counter.inc()
            else:
                badge_counter.inc()

    @app.after_request
    def add_headers(response):
        """
        Generic rules for headers to add to all requests

        - X-Hostname: Mention the name of the host/pod running the application
        - Cache-Control: Add cache-control headers for public and private pages
        """

        response.headers["X-Hostname"] = socket.gethostname()

        if response.status_code == 200:
            if flask.session:
                response.headers["Cache-Control"] = "private"
            else:
                # Only add caching headers to successful responses
                if not response.headers.get("Cache-Control"):
                    response.headers["Cache-Control"] = ", ".join(
                        {
                            "public",
                            "max-age=61",
                            "stale-while-revalidate=300",
                            "stale-if-error=86400",
                        }
                    )

        return response
