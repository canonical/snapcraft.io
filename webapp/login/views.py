import os

import flask
from canonicalwebteam.store_api.dashboard import Dashboard
from canonicalwebteam.store_api.publishergw import PublisherGW
from canonicalwebteam.store_api.devicegw import DeviceGW

from django_openid_auth.teams import TeamsRequest, TeamsResponse
from flask_openid import OpenID

from webapp import authentication
from webapp.helpers import api_publisher_session, api_session
from webapp.api.exceptions import ApiResponseError
from webapp.extensions import csrf
from webapp.login.macaroon import MacaroonRequest, MacaroonResponse
from webapp.observability.utils import trace_function
from webapp.publisher.snaps import logic

login = flask.Blueprint(
    "login", __name__, template_folder="/templates", static_folder="/static"
)

LOGIN_URL = os.getenv("LOGIN_URL", "https://login.ubuntu.com")
ENVIRONMENT = os.getenv("ENVIRONMENT", "devel")


# getter for ENVIRONMENT variable
# this allows the value to be mocked in tests
def get_environment():
    return ENVIRONMENT


LP_CANONICAL_TEAM = "canonical"

open_id = OpenID(
    store_factory=lambda: None,
    safe_roots=[],
    extension_responses=[MacaroonResponse, TeamsResponse],
)

dashboard = Dashboard(api_session)
publisher_gateway = PublisherGW(api_publisher_session)
device_gateway = DeviceGW("snap", api_session)


@trace_function
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

    account = dashboard.get_account(flask.session)
    validation_sets = dashboard.get_validation_sets(flask.session)

    if account:
        is_canonical = LP_CANONICAL_TEAM in resp.extensions["lp"].is_member

        # in environments other than production, for testing purposes,
        # we detect if the user is Canonical by checking
        # if the email ends with @canonical.com
        if (not is_canonical) and get_environment() != "production":
            is_canonical = account["email"] and account["email"].endswith(
                "@canonical.com"
            )

        flask.session["publisher"] = {
            "identity_url": resp.identity_url,
            "nickname": account["username"],
            "fullname": account["displayname"],
            "image": resp.image,
            "email": account["email"],
            "is_canonical": is_canonical,
        }

        if logic.get_stores(
            account["stores"], roles=["admin", "review", "view"]
        ):
            flask.session["publisher"]["has_stores"] = (
                len(dashboard.get_stores(flask.session)) > 0
            )

        flask.session["publisher"]["has_validation_sets"] = (
            validation_sets is not None
            and len(validation_sets["assertions"]) > 0
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


@trace_function
@login.route("/logout")
def logout():
    authentication.empty_session(flask.session)

    return flask.redirect("/")
