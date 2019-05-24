import flask
import webapp.api.dashboard as api
import webapp.api.marketo as marketo_api
from webapp import authentication
from webapp.api.exceptions import (
    AgreementNotSigned,
    ApiCircuitBreaker,
    ApiError,
    ApiResponseError,
    ApiResponseErrorList,
    ApiTimeoutError,
    MacaroonRefreshRequired,
    MissingUsername,
)
from webapp.decorators import login_required

account = flask.Blueprint(
    "account", __name__, template_folder="/templates", static_folder="/static"
)


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


def _handle_errors(api_error: ApiError):
    if type(api_error) is ApiTimeoutError:
        return flask.abort(504, str(api_error))
    elif type(api_error) is MissingUsername:
        return flask.redirect(flask.url_for(".get_account_name"))
    elif type(api_error) is AgreementNotSigned:
        return flask.redirect(flask.url_for(".get_agreement"))
    elif type(api_error) is MacaroonRefreshRequired:
        return refresh_redirect(flask.request.path)
    elif type(api_error) is ApiCircuitBreaker:
        return flask.abort(503)
    else:
        return flask.abort(502, str(api_error))


def _handle_error_list(errors):
    codes = [error["code"] for error in errors]

    error_messages = ", ".join(codes)
    return flask.abort(502, error_messages)


@account.route("/")
@login_required
def get_account():
    return flask.redirect(flask.url_for("publisher_snaps.get_account_snaps"))


@account.route("/details")
@login_required
def get_account_details():
    try:
        # We don't use the data from this endpoint.
        # It is mostly used to make sure the user has signed
        # the terms and conditions.
        api.get_account(flask.session)
    except ApiResponseErrorList as api_response_error_list:
        return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_errors(api_error)

    flask_user = flask.session["openid"]

    marketo = marketo_api.MarketoApi()
    marketo_user = marketo.get_user(flask_user["email"])
    marketo_subscribed = marketo.get_newsletter_subscription(
        marketo_user["id"]
    )

    context = {
        "image": flask_user["image"],
        "username": flask_user["nickname"],
        "displayname": flask_user["fullname"],
        "email": flask_user["email"],
        "subscriptions": {
            "newsletter": marketo_subscribed["snapcraftnewsletter"]
        },
    }

    return flask.render_template("publisher/account-details.html", **context)


@account.route("/details", methods=["POST"])
@login_required
def post_account_details():
    newsletter_status = flask.request.form.get("newsletter")
    email = flask.request.form.get("email")

    marketo = marketo_api.MarketoApi()
    marketo.set_newsletter_subscription(email, newsletter_status)

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
            api.post_agreement(flask.session, True)
        except ApiResponseErrorList as api_response_error_list:
            codes = [error["code"] for error in api_response_error_list.errors]
            error_messages = ", ".join(codes)
            flask.abort(502, error_messages)
        except ApiError as api_error:
            return _handle_errors(api_error)

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
            api.post_username(flask.session, username)
        except ApiResponseErrorList as api_response_error_list:
            errors = errors + api_response_error_list.errors
        except ApiError as api_error:
            return _handle_errors(api_error)

        if errors:
            return flask.render_template(
                "publisher/username.html", username=username, error_list=errors
            )

        return flask.redirect(flask.url_for(".get_account"))
    else:
        return flask.redirect(flask.url_for(".get_account_name"))
