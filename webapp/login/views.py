import os

import flask
from canonicalwebteam.candid import CandidClient
from canonicalwebteam.store_api.stores.snapstore import (
    SnapPublisher,
    SnapStoreAdmin,
)
from canonicalwebteam.store_api.stores.charmstore import CharmPublisher

from django_openid_auth.teams import TeamsRequest, TeamsResponse
from flask_openid import OpenID

from webapp import authentication
from webapp.helpers import api_publisher_session
from webapp.api.exceptions import ApiResponseError
from webapp.extensions import csrf
from webapp.login.macaroon import MacaroonRequest, MacaroonResponse
from webapp.publisher.snaps import logic

login = flask.Blueprint(
    "login", __name__, template_folder="/templates", static_folder="/static"
)

LOGIN_URL = os.getenv("LOGIN_URL", "https://login.ubuntu.com")

LP_CANONICAL_TEAM = "canonical"
LP_ADMIN_TEAM = "featured-packages-editors"

open_id = OpenID(
    store_factory=lambda: None,
    safe_roots=[],
    extension_responses=[MacaroonResponse, TeamsResponse],
)

publisher_api = SnapPublisher(api_publisher_session)
admin_api = SnapStoreAdmin(api_publisher_session)
candid = CandidClient(api_publisher_session)
charm_publisher_api = CharmPublisher(api_publisher_session)


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

    openid_macaroon = MacaroonRequest(
        caveat_id=authentication.get_caveat_id(root)
    )
    flask.session["macaroon_root"] = root

    lp_teams = TeamsRequest(
        query_membership=[LP_CANONICAL_TEAM, LP_ADMIN_TEAM]
    )

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

    account = publisher_api.get_account(flask.session)

    if account:
        flask.session["publisher"] = {
            "identity_url": resp.identity_url,
            "nickname": account["username"],
            "fullname": account["displayname"],
            "image": resp.image,
            "email": account["email"],
            "is_canonical": LP_CANONICAL_TEAM
            in resp.extensions["lp"].is_member,
            "is_admin": LP_ADMIN_TEAM in resp.extensions["lp"].is_member,
        }

        if logic.get_stores(
            account["stores"], roles=["admin", "review", "view"]
        ):
            flask.session["publisher"]["has_stores"] = (
                len(admin_api.get_stores(flask.session)) > 0
            )
    else:
        flask.session["publisher"] = {
            "identity_url": resp.identity_url,
            "nickname": resp.nickname,
            "fullname": resp.fullname,
            "image": resp.image,
            "email": resp.email,
        }

    response = flask.make_response(
        flask.redirect(
            open_id.get_next_url(),
            302,
        ),
    )
    # this is a temporary cookies to be taken out later
    response.set_cookie("login_migrated", "true")
    return response


@login.route("/login-beta", methods=["GET"])
def login_beta():
    return flask.redirect(flask.url_for(".login_handler"))


@login.route("/logout")
def logout():
    authentication.empty_session(flask.session)

    return flask.redirect("/")
