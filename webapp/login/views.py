import os

import flask
from canonicalwebteam.store_api.stores.snapstore import SnapPublisher
from django_openid_auth.teams import TeamsRequest, TeamsResponse
from flask_openid import OpenID
from webapp import authentication
from webapp.helpers import api_session
from webapp.api.exceptions import ApiCircuitBreaker, ApiError, ApiResponseError
from webapp.extensions import csrf
from webapp.login.macaroon import MacaroonRequest, MacaroonResponse
from webapp.publisher.snaps import logic

login = flask.Blueprint(
    "login", __name__, template_folder="/templates", static_folder="/static"
)

LOGIN_URL = os.getenv("LOGIN_URL", "https://login.ubuntu.com")

LP_CANONICAL_TEAM = "canonical"

open_id = OpenID(
    stateless=True,
    safe_roots=[],
    extension_responses=[MacaroonResponse, TeamsResponse],
)

publisher_api = SnapPublisher(api_session)


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

    lp_teams = TeamsRequest(query_membership=[LP_CANONICAL_TEAM])

    return open_id.try_login(
        LOGIN_URL,
        ask_for=["email", "nickname", "image"],
        ask_for_optional=["fullname"],
        extensions=[openid_macaroon, lp_teams],
    )


@open_id.after_login
def after_login(resp):
    flask.session["macaroon_discharge"] = resp.extensions["macaroon"].discharge
    if not resp.nickname:
        return flask.redirect(LOGIN_URL)

    try:
        account = publisher_api.get_account(flask.session)
        flask.session["openid"] = {
            "identity_url": resp.identity_url,
            "nickname": account["username"],
            "fullname": account["displayname"],
            "image": resp.image,
            "email": account["email"],
            "is_canonical": LP_CANONICAL_TEAM
            in resp.extensions["lp"].is_member,
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
    authentication.empty_session(flask.session)

    return flask.redirect("/")
