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
            authentication.empty_session(flask.session)
            return flask.redirect(f"/{login_path}?next={flask.request.url}")

        return func(*args, **kwargs)

    return is_user_logged_in


def candid_login_required(store_id, url):
    def inner(func):
        def wrapper(*args, **kwargs):
            if "developer_token" not in flask.session:
                return flask.redirect(f"/login-beta?next=/admin/{store_id}/{url}")
            return func(*args, **kwargs)
        return wrapper
    return inner

# def candid_login_required(url):
#     def dev_token_required(func):
#         """
#         Decorator that checks if a user is authenticated in via candid(login-beta),
#         and redirects to /login-beta page if not.
#         """

#         @functools.wraps(func)
#         def is_candid_authneticated(*args, **kwargs):
#             if "developer_token" not in flask.session:
#                 return flask.redirect(f"/login-beta?next={url}")
#             return func(*args, **kwargs)

#         return is_candid_authneticated
#     return dev_token_required
