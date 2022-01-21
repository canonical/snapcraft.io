import os
import datetime

import flask
from canonicalwebteam.candid import CandidClient
from canonicalwebteam.store_api.stores.snapstore import SnapPublisher
from canonicalwebteam.store_api.exceptions import (
    StoreApiError,
    StoreApiResponseErrorList,
)
from django_openid_auth.teams import TeamsRequest, TeamsResponse
from flask_openid import OpenID
from flask_wtf.csrf import generate_csrf, validate_csrf

from webapp import authentication
from webapp.helpers import api_publisher_session
from webapp.api.exceptions import ApiError, ApiResponseError
from webapp.extensions import csrf
from webapp.login.macaroon import MacaroonRequest, MacaroonResponse
from webapp.publisher.snaps import logic
from webapp.publisher.views import _handle_error, _handle_error_list

login = flask.Blueprint(
    "login", __name__, template_folder="/templates", static_folder="/static"
)

LOGIN_URL = os.getenv("LOGIN_URL", "https://login.ubuntu.com")

LP_CANONICAL_TEAM = "canonical"

open_id = OpenID(
    store_factory=lambda: None,
    safe_roots=[],
    extension_responses=[MacaroonResponse, TeamsResponse],
)

publisher_api = SnapPublisher(api_publisher_session)
candid = CandidClient(api_publisher_session)


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
    flask.session.pop("macaroons", None)

    flask.session["macaroon_discharge"] = resp.extensions["macaroon"].discharge
    if not resp.nickname:
        return flask.redirect(LOGIN_URL)

    try:
        account = publisher_api.get_account(flask.session)
        flask.session["publisher"] = {
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
        flask.session["publisher"]["stores"] = logic.get_stores(
            account["stores"], roles=["admin", "review", "view"]
        )
    except Exception:
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

    # Set cookie to know where to redirect users for re-auth
    response.set_cookie(
        "last_login_method",
        "sso",
        expires=datetime.datetime.now() + datetime.timedelta(days=365),
    )

    return response


@login.route("/login-beta", methods=["GET"])
@csrf.exempt
def login_candid():
    if authentication.is_authenticated(flask.session):
        return flask.redirect(
            flask.url_for("publisher_snaps.get_account_snaps")
        )

    # Get a bakery v2 macaroon from the publisher API to be discharged
    # and save it in the session
    flask.session["publisher-macaroon"] = publisher_api.get_macaroon(
        authentication.PERMISSIONS
    )

    login_url = candid.get_login_url(
        macaroon=flask.session["publisher-macaroon"],
        callback_url=flask.url_for("login.login_callback", _external=True),
        state=generate_csrf(),
    )

    # Next URL to redirect the user after the login
    next_url = flask.request.args.get("next")

    if next_url:
        if not next_url.startswith("/") and not next_url.startswith(
            flask.request.url_root
        ):
            return flask.abort(400)
        flask.session["next_url"] = next_url

    return flask.redirect(login_url, 302)


@login.route("/login/callback")
def login_callback():
    code = flask.request.args["code"]
    state = flask.request.args["state"]

    flask.session.pop("macaroon_root", None)
    flask.session.pop("macaroon_discharge", None)

    # Avoid CSRF attacks
    validate_csrf(state)

    discharged_token = candid.discharge_token(code)
    candid_macaroon = candid.discharge_macaroon(
        flask.session["publisher-macaroon"], discharged_token
    )

    # Store bakery authentication
    flask.session["macaroons"] = candid.get_serialized_bakery_macaroon(
        flask.session["publisher-macaroon"], candid_macaroon
    )

    try:
        publisher = publisher_api.whoami(flask.session)
        account = publisher_api.get_account(flask.session)
    except StoreApiResponseErrorList as api_response_error_list:
        return _handle_error_list(api_response_error_list.errors)
    except (StoreApiError, ApiError) as api_error:
        return _handle_error(api_error)

    flask.session["publisher"] = {
        "account_id": publisher["account"]["id"],
        "nickname": publisher["account"]["username"],
        "fullname": publisher["account"]["name"],
        "image": None,
        "email": publisher["account"]["email"],
    }

    flask.session["publisher"]["stores"] = logic.get_stores(
        account["stores"], roles=["admin", "review", "view"]
    )

    response = flask.make_response(
        flask.redirect(
            flask.session.pop(
                "next_url",
                flask.url_for("publisher_snaps.get_account_snaps"),
            ),
            302,
        ),
    )

    # Set cookie to know where to redirect users for re-auth
    response.set_cookie(
        "last_login_method",
        "candid",
        expires=datetime.datetime.now() + datetime.timedelta(days=365),
    )

    return response


@login.route("/logout")
def logout():
    authentication.empty_session(flask.session)

    return flask.redirect("/")
