# Core packages
import functools

# Third party packages
import flask
from webapp import authentication
from talisker import logging


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
            missing_session_data = []
            if "publisher" not in flask.session:
                missing_session_data.append("publisher")

            if "macaroons" not in flask.session:
                missing_session_data.append("macaroons")

            if "macaroon_discharge" not in flask.session:
                missing_session_data.append("macaroon_discharge")

            if "macaroon_root" not in flask.session:
                missing_session_data.append("macaroon_root")

            if missing_session_data:
                logging.getLogger("talisker.wsgi").error(
                    "User not authenticated",
                    extra={
                        "missing_session_data": missing_session_data,
                        "email": (
                            flask.session["publisher"]["email"]
                            if "publisher" in flask.session
                            else None
                        ),
                    },
                )

            authentication.empty_session(flask.session)
            return flask.redirect(f"/{login_path}?next={flask.request.path}")

        return func(*args, **kwargs)

    return is_user_logged_in
