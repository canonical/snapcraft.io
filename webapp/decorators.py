# Core packages
import functools

# Third party packages
import flask

from canonicalwebteam.store_api.stores.snapstore import SnapPublisher

from webapp import authentication
from webapp.helpers import api_publisher_session

publisher_api = SnapPublisher(api_publisher_session)


def login_required(func):
    """
    Decorator that checks if a user is logged in, and redirects
    to login page if not.
    """

    @functools.wraps(func)
    def is_user_logged_in(*args, **kwargs):
        if not authentication.is_authenticated(flask.session):
            authentication.empty_session(flask.session)
            return flask.redirect(f"/login?next={flask.request.path}")

        return func(*args, **kwargs)

    return is_user_logged_in


def exchange_required(func):
    @functools.wraps(func)
    def is_exchanged(*args, **kwargs):
        if "developer_token" not in flask.session:
            flask.session[
                "developer_token"
            ] = publisher_api.exchange_dashboard_macaroons(flask.session)
        return func(*args, **kwargs)

    return is_exchanged
