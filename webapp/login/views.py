import os
from urllib.parse import quote

import flask
from flask_openid import OpenID
from webapp import authentication
from webapp.api import dashboard
from webapp.api.exceptions import ApiCircuitBreaker, ApiError, ApiResponseError
from webapp.extensions import csrf
from webapp.login.macaroon import MacaroonRequest, MacaroonResponse
from webapp.publisher.snaps import logic

login = flask.Blueprint(
    "login", __name__, template_folder="/templates", static_folder="/static"
)

LOGIN_URL = os.getenv("LOGIN_URL", "https://login.ubuntu.com")

BSI_URL = os.getenv("BSI_URL", "https://build.snapcraft.io")

open_id = OpenID(
    stateless=True, safe_roots=[], extension_responses=[MacaroonResponse]
)


@login.route("/login", methods=["GET", "POST"])
@csrf.exempt
@open_id.loginhandler
def login_handler():
    if authentication.is_authenticated(flask.session):
        return flask.redirect(open_id.get_next_url())

    try:
        root = authentication.request_macaroon()
    except ApiResponseError as api_response_error:
        if api_response_error.status_code == 401:
            return flask.redirect(flask.url_for(".logout"))
        else:
            return flask.abort(502, str(api_response_error))
    except ApiCircuitBreaker:
        flask.abort(503)
    except ApiError as api_error:
        return flask.abort(502, str(api_error))

    openid_macaroon = MacaroonRequest(
        caveat_id=authentication.get_caveat_id(root)
    )
    flask.session["macaroon_root"] = root

    return open_id.try_login(
        LOGIN_URL,
        ask_for=["email", "nickname", "image"],
        ask_for_optional=["fullname"],
        extensions=[openid_macaroon],
    )


@open_id.after_login
def after_login(resp):
    flask.session["macaroon_discharge"] = resp.extensions["macaroon"].discharge

    if not resp.nickname:
        return flask.redirect(LOGIN_URL)

    try:
        account = dashboard.get_account(flask.session)
        flask.session["openid"] = {
            "identity_url": resp.identity_url,
            "nickname": account["username"],
            "fullname": account["displayname"],
            "image": resp.image,
            "email": account["email"],
        }
        owned, shared = logic.get_snap_names_by_ownership(account)
        flask.session["user_shared_snaps"] = shared

    except ApiCircuitBreaker:
        flask.abort(503)
    except Exception:
        flask.session["openid"] = {
            "identity_url": resp.identity_url,
            "nickname": resp.nickname,
            "fullname": resp.fullname,
            "image": resp.image,
            "email": resp.email,
        }

    return flask.redirect(open_id.get_next_url())


@login.route("/logout")
def logout():
    no_redirect = flask.request.args.get("no_redirect", default="false")

    if authentication.is_authenticated(flask.session):
        authentication.empty_session(flask.session)

    if no_redirect == "true":
        return flask.redirect("/")
    else:
        redirect_url = quote(flask.request.url_root, safe="")
        return flask.redirect(
            f"{LOGIN_URL}/+logout?return_to={redirect_url}&return_now=True"
        )
