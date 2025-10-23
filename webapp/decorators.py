# Core packages
import functools
import logging
from datetime import datetime, timezone

# Third party packages
import flask

from canonicalwebteam.store_api.publishergw import PublisherGW

from webapp import authentication
from webapp.helpers import api_publisher_session

publisher_gateway = PublisherGW(api_publisher_session)
logger = logging.getLogger(__name__)


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

            return flask.redirect(f"/login?next={flask.request.path}")

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
