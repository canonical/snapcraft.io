# Core packages
import functools
import logging
from datetime import datetime, timezone

# Third party packages
import flask

from canonicalwebteam.store_api.dashboard import Dashboard
from canonicalwebteam.store_api.publishergw import PublisherGW

from webapp import authentication
from webapp.helpers import api_publisher_session

publisher_gateway = PublisherGW(api_publisher_session)
_dashboard = Dashboard(api_publisher_session)
logger = logging.getLogger(__name__)

# Per-<snap_name> endpoints that must stay reachable even when the snap has
# no published revisions.
_UNRELEASED_GATE_SKIP_ENDPOINTS = frozenset(
    {
        "publisher_snaps.delete_package",
        "publisher_snaps.get_package_metadata",
        "publisher_snaps.get_is_user_snap",
        "publisher_snaps.post_github_webhook",
    }
)


def gate_unreleased_snap_pages():
    """
    Block state-changing per-<snap_name> publisher requests when the snap has
    no published revisions. Read requests pass through so the page can render
    with a warning banner, but saves are rejected to prevent the dashboard API
    from returning opaque errors mid-flow.
    """

    # Page itself needs to load
    if flask.request.method in ("GET", "HEAD", "OPTIONS"):
        return None
    if not flask.request.view_args:
        return None
    snap_name = flask.request.view_args.get("snap_name")
    if not snap_name:
        return None
    if flask.request.endpoint in _UNRELEASED_GATE_SKIP_ENDPOINTS:
        return None
    if not authentication.is_authenticated(flask.session):
        return None

    try:
        history = _dashboard.snap_release_history(flask.session, snap_name, 1)
    except Exception:
        # If we can't determine release state (dashboard down, network error,
        # auth issue), don't block the request. Let the downstream handler
        # produce its normal response.
        return None

    revisions = []
    if isinstance(history, dict):
        revisions = history.get("revisions") or []
    elif isinstance(history, list):
        revisions = history

    if revisions:
        return None

    return (
        flask.jsonify(
            {
                "success": False,
                "errors": [
                    {
                        "code": "no-releases",
                        "message": (
                            "Publish a first revision before saving "
                            "changes to this snap."
                        ),
                    }
                ],
            }
        ),
        403,
    )


def login_required(func):
    """
    Decorator that checks if a user is logged in, and redirects
    to login page if not.
    """

    @functools.wraps(func)
    def is_user_logged_in(*args, **kwargs):
        date = datetime.now(timezone.utc)
        date_str = date.strftime("%Y-%m-%dT%H:%M:%S")

        if not authentication.is_authenticated(flask.session):
            authentication.empty_session(flask.session)

            logger.warning(
                "User login failed",
                extra={
                    "datetime": date_str,
                    "appid": "snapcraft-io",
                    "event": "authn_login_fail",
                },
            )

            return flask.redirect(
                flask.url_for("login.login_handler", next=flask.request.path)
            )

        publisher = flask.session.get("publisher")
        user = publisher["email"]

        logger.info(
            f"User {user} login successfully",
            extra={
                "datetime": date_str,
                "appid": "snapcraft-io",
                "event": f"authn_login_successafterfail:{user}",
            },
        )

        return func(*args, **kwargs)

    return is_user_logged_in


def exchange_required(func):
    @functools.wraps(func)
    def is_exchanged(*args, **kwargs):
        if "exchanged_developer_token" not in flask.session:
            result = publisher_gateway.exchange_dashboard_macaroons(
                flask.session
            )
            flask.session["developer_token"] = result
            flask.session["exchanged_developer_token"] = True
        return func(*args, **kwargs)

    return is_exchanged
