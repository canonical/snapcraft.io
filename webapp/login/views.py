import os

import flask
from canonicalwebteam.store_api.dashboard import Dashboard
from canonicalwebteam.store_api.publishergw import PublisherGW
from canonicalwebteam.store_api.devicegw import DeviceGW

from django_openid_auth.teams import TeamsRequest, TeamsResponse
from flask_openid import OpenID

from webapp import authentication
from webapp.decorators import login_required
from webapp.helpers import api_publisher_session, api_session
from webapp.api.exceptions import ApiResponseError
from webapp.extensions import csrf
from webapp.login.macaroon import MacaroonRequest, MacaroonResponse
from webapp.publisher.snaps import logic
from webapp.publisher.snaps.build_views import (
    complete_pending_snap_authorization,
)
from canonicalwebteam.exceptions import StoreApiResponseErrorList

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


@login.route("/login/snap-build-authorization", methods=["GET", "POST"])
@csrf.exempt
@open_id.loginhandler
@login_required
def authorize_snap_build():
    """
    Kick off a discharge round-trip for a snap's Launchpad build/upload
    macaroon (see
    webapp/publisher/snaps/build_views.py:post_snap_builds).

    The macaroon returned by the store's package-upload-macaroon endpoint
    carries an SSO third-party caveat that is unique to that macaroon; it
    can only be discharged by redirecting the user through login.ubuntu.com
    for *that specific* caveat_id. A discharge obtained anywhere else
    (e.g. at the user's original login) cannot be reused here.
    """
    pending = flask.session.get("pending_snap_authorization")

    if not pending:
        flask.flash("Nothing to authorize.", "negative")
        return flask.redirect("/")

    macaroon_request = MacaroonRequest(
        caveat_id=authentication.get_caveat_id(pending["root_macaroon"])
    )

    return open_id.try_login(
        LOGIN_URL,
        extensions=[macaroon_request],
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
    # This same OpenID round-trip is reused for two purposes: a normal
    # user login, and (see authorize_snap_build above) discharging a
    # snap's Launchpad upload macaroon. Handle the latter first and bail
    # out early, since none of the account/session logic below applies.
    pending = flask.session.pop("pending_snap_authorization", None)
    if pending:
        discharge_macaroon = resp.extensions["macaroon"].discharge
        return complete_pending_snap_authorization(pending, discharge_macaroon)

    discharge_macaroon = resp.extensions["macaroon"].discharge
    flask.session["macaroon_discharge"] = discharge_macaroon

    if not resp.nickname:
        return flask.redirect(LOGIN_URL)

    # Exchange root + discharge for a single dashboard token.
    # Both keys are in the session here, so exchange_dashboard_macaroons
    # can read them directly. We then drop them to keep the cookie small.
    try:
        flask.session["macaroon_exchanged"] = (
            publisher_gateway.exchange_dashboard_macaroons(flask.session)
        )
    except StoreApiResponseErrorList as api_error:
        # A brand-new publisher who has never accepted the developer Terms &
        # Conditions has no publisher account yet, so the macaroon exchange
        # fails with "account-not-found". Rather than returning a 404, keep
        # the dashboard (root + discharge) macaroons, establish a minimal
        # authenticated session and guide the user to the agreement page.
        # Accepting the agreement creates the account, after which the
        # exchange succeeds on the next request. See issue #5788.
        if any(
            error.get("code") == "account-not-found"
            for error in api_error.errors
        ):
            flask.session["publisher"] = {
                "identity_url": resp.identity_url,
                "nickname": resp.nickname,
                "fullname": resp.fullname,
                "image": resp.image,
                "email": resp.email,
            }
            return flask.redirect(flask.url_for("account.get_agreement"))
        raise

    flask.session.pop("macaroon_root", None)
    flask.session.pop("macaroon_discharge", None)

    flask.session["publisher"] = {
        "identity_url": resp.identity_url,
        "nickname": resp.nickname,
        "fullname": resp.fullname,
        "image": resp.image,
        "email": resp.email,
    }

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

    response = flask.make_response(
        flask.redirect(
            open_id.get_next_url(),
            302,
        ),
    )
    return response


@login.route("/login-beta", methods=["GET"])
def login_beta():
    return flask.redirect(flask.url_for(".login_handler"))


@login.route("/logout")
def logout():
    authentication.empty_session(flask.session)

    return flask.redirect("/")
