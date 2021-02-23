import socket
from urllib.parse import unquote, urlparse, urlunparse

import flask
import prometheus_client
import user_agents
import webapp.template_utils as template_utils
from canonicalwebteam import image_template
from webapp import authentication

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
        else:
            user_name = None
            user_is_canonical = False

        page_slug = template_utils.generate_slug(flask.request.path)

        is_brand_store = False

        if "STORE_QUERY" in app.config["WEBAPP_CONFIG"]:
            is_brand_store = True

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
            "webapp_config": app.config["WEBAPP_CONFIG"],
            "BSI_URL": app.config["BSI_URL"],
            "IS_BRAND_STORE": is_brand_store,
            "now": datetime.now(),
            "user_is_canonical": user_is_canonical,
            # Functions
            "contains": template_utils.contains,
            "join": template_utils.join,
            "static_url": template_utils.static_url,
            "format_number": template_utils.format_number,
            "display_name": template_utils.display_name,
            "install_snippet": template_utils.install_snippet,
            "format_date": template_utils.format_date,
            "format_member_role": template_utils.format_member_role,
            "image": image_template,
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

        if not app.testing:
            app.extensions["sentry"].captureException()

        return (
            flask.render_template("50X.html", error_name=error_name),
            return_code,
        )

    @app.errorhandler(503)
    def service_unavailable(error):
        return flask.render_template("503.html"), 503

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
        if not agent_string.startswith(("kube-probe", "Prometheus")):
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
