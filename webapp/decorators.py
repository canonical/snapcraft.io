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
        last_login_method = flask.request.cookies.get("last_login_method")
        login_path = "login-beta" if last_login_method == "candid" else "login"

        if not authentication.is_authenticated(flask.session):
            return flask.redirect(f"/{login_path}?next={flask.request.path}")

        return func(*args, **kwargs)

    return is_user_logged_in
