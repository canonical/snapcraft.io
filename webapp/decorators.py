# Core packages
import functools

# Third party packages
import flask
from webapp import authentication


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
