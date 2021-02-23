# Packages
import flask
from canonicalwebteam.store_api.exceptions import (
    PublisherAgreementNotSigned,
    PublisherMacaroonRefreshRequired,
    PublisherMissingUsername,
    StoreApiCircuitBreaker,
    StoreApiTimeoutError,
)
from canonicalwebteam.store_api.stores.snapstore import SnapPublisher
from canonicalwebteam.store_api.exceptions import (
    StoreApiError,
    StoreApiResponseErrorList,
)


# Local
import webapp.api.marketo as marketo_api
from webapp import authentication
from webapp.helpers import api_publisher_session
from webapp.api.exceptions import (
    ApiCircuitBreaker,
    ApiError,
    ApiResponseError,
    ApiTimeoutError,
)
from webapp.decorators import login_required

account = flask.Blueprint(
    "account", __name__, template_folder="/templates", static_folder="/static"
)

marketo = marketo_api.Marketo()
publisher_api = SnapPublisher(api_publisher_session)


def refresh_redirect(path):
    try:
        macaroon_discharge = authentication.get_refreshed_discharge(
            flask.session["macaroon_discharge"]
        )
    except ApiResponseError as api_response_error:
        if api_response_error.status_code == 401:
            return flask.redirect(flask.url_for("login.logout"))
        else:
            return flask.abort(502, str(api_response_error))
    except ApiError as api_error:
        return flask.abort(502, str(api_error))

    flask.session["macaroon_discharge"] = macaroon_discharge
    return flask.redirect(path)


def _handle_error(api_error: ApiError):
    if type(api_error) in [ApiTimeoutError, StoreApiTimeoutError]:
        return flask.abort(504, str(api_error))
    elif type(api_error) is PublisherMissingUsername:
        return flask.redirect(flask.url_for("account.get_account_name"))
    elif type(api_error) is PublisherAgreementNotSigned:
        return flask.redirect(flask.url_for("account.get_agreement"))
    elif type(api_error) is PublisherMacaroonRefreshRequired:
        return refresh_redirect(flask.request.path)
    elif type(api_error) in [ApiCircuitBreaker, StoreApiCircuitBreaker]:
        return flask.abort(503)
    else:
        return flask.abort(502, str(api_error))


def _handle_error_list(errors):
    if len(errors) == 1 and errors[0]["code"] in [
        "macaroon-permission-required",
        "macaroon-authorization-required",
    ]:
        authentication.empty_session(flask.session)
        return flask.redirect("/login?next=" + flask.request.path)

    codes = [
        f"{error['code']}: {error.get('message', 'No message')}"
        for error in errors
    ]

    error_messages = ", ".join(codes)
    return flask.abort(502, error_messages)


@account.route("/")
@login_required
def get_account():
    return flask.redirect(flask.url_for("publisher_snaps.get_account_snaps"))


@account.route("/details", methods=["GET"])
@login_required
def get_account_details():
    try:
        # We don't use the data from this endpoint.
        # It is mostly used to make sure the user has signed
        # the terms and conditions.
        publisher_api.get_account(flask.session)
    except StoreApiResponseErrorList as api_response_error_list:
        return _handle_error_list(api_response_error_list.errors)
    except (StoreApiError, ApiError) as api_error:
        return _handle_error(api_error)

    flask_user = flask.session["publisher"]

    subscriptions = None

    # don't rely on marketo to show the page,
    # if anything fails, just continue and don't show
    # this section
    try:
        subscribed_to_newsletter = False
        marketo_user = marketo.get_user(flask_user["email"])
        if marketo_user:
            marketo_subscribed = marketo.get_newsletter_subscription(
                marketo_user["id"]
            )
            if marketo_subscribed.get("snapcraftnewsletter"):
                subscribed_to_newsletter = True

        subscriptions = {"newsletter": subscribed_to_newsletter}
    except Exception:
        if "sentry" in flask.current_app.extensions:
            flask.current_app.extensions["sentry"].captureException()

    context = {
        "image": flask_user["image"],
        "username": flask_user["nickname"],
        "displayname": flask_user["fullname"],
        "email": flask_user["email"],
        "subscriptions": subscriptions,
    }

    return flask.render_template("publisher/account-details.html", **context)


@account.route("/details", methods=["POST"])
@login_required
def post_account_details():
    try:
        newsletter_status = flask.request.form.get("newsletter")
        email = flask.request.form.get("email")
        marketo.set_newsletter_subscription(email, newsletter_status)
        flask.flash("Changes applied successfully.", "positive")
    except Exception:
        flask.flash("There was an error, please try again.", "negative")

    return flask.redirect(flask.url_for("account.get_account_details"))


@account.route("/agreement")
@login_required
def get_agreement():
    return flask.render_template(
        "publisher/developer_programme_agreement.html"
    )


@account.route("/agreement", methods=["POST"])
@login_required
def post_agreement():
    agreed = flask.request.form.get("i_agree")
    if agreed == "on":
        try:
            publisher_api.post_agreement(flask.session, True)
        except StoreApiResponseErrorList as api_response_error_list:
            codes = [error["code"] for error in api_response_error_list.errors]
            error_messages = ", ".join(codes)
            flask.abort(502, error_messages)
        except (StoreApiError, ApiError) as api_error:
            return _handle_error(api_error)

        return flask.redirect(flask.url_for(".get_account"))
    else:
        return flask.redirect(flask.url_for(".get_agreement"))


@account.route("/username")
@login_required
def get_account_name():
    return flask.render_template("publisher/username.html")


@account.route("/username", methods=["POST"])
@login_required
def post_account_name():
    username = flask.request.form.get("username")

    if username:
        errors = []
        try:
            publisher_api.post_username(flask.session, username)
        except StoreApiResponseErrorList as api_response_error_list:
            errors = errors + api_response_error_list.errors
        except (StoreApiError, ApiError) as api_error:
            return _handle_error(api_error)

        if errors:
            return flask.render_template(
                "publisher/username.html", username=username, error_list=errors
            )

        return flask.redirect(flask.url_for(".get_account"))
    else:
        return flask.redirect(flask.url_for(".get_account_name"))
