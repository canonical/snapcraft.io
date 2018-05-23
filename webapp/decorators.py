# Core packages
import functools

# Third party packages
import flask
from canonicalwebteam.snapstoreapi import authentication


def login_required(func):
    """
    Decorator that checks if a user is logged in, and redirects
    to login page if not.
    """
    @functools.wraps(func)
    def is_user_logged_in(*args, **kwargs):
        if not authentication.is_authenticated(flask.session):
            return flask.redirect('login?next=' + flask.request.path)

        return func(*args, **kwargs)
    return is_user_logged_in
