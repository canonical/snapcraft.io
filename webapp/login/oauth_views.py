import os

import flask
from webapp.decorators import login_required
from webapp.api.requests import Session
from urllib.parse import urlencode
from werkzeug.exceptions import BadRequest


oauth = flask.Blueprint(
    "oauth", __name__, template_folder="/templates", static_folder="/static"
)


@oauth.route("/github/auth", methods=["GET"])
@login_required
def github_auth():
    """
    Redirect to authorize our Github application and request
    access to the user's data.
    """

    if flask.request.args.get("back"):
        flask.session["github_auth_redirect"] = flask.request.headers.get(
            "Referer"
        )

    params = {
        "client_id": os.getenv("GITHUB_CLIENT_ID"),
        "scope": "repo read:org",
        "state": flask.session["csrf_token"],
    }

    return flask.redirect(
        f"https://github.com/login/oauth/authorize?{urlencode(params)}"
    )


@oauth.route("/github/auth/verify", methods=["GET"])
@login_required
def github_login_verify():
    """
    Handles response after the redirect to Github. This response determines
    if the user has allowed this application access. If we were then we send
    a POST request for the access_key used to authenticate requests to Github.
    """
    url_to_redirect = flask.session.pop(
        "github_auth_redirect", flask.url_for("snapcraft.homepage")
    )

    state = flask.request.args.get("state")

    # Avoid CSRF attacks
    if state != flask.session["csrf_token"]:
        flask.flash("Invalid request", "negative")
        return flask.redirect(url_to_redirect)

    data = {
        "code": flask.request.args.get("code"),
        "client_id": os.getenv("GITHUB_CLIENT_ID"),
        "client_secret": os.getenv("GITHUB_CLIENT_SECRET"),
    }

    session = Session()
    response = session.request(
        method="POST",
        url="https://github.com/login/oauth/access_token",
        json=data,
        headers={"Accept": "application/json"},
    )

    data = response.json()

    if "error" in data:
        raise BadRequest(data["error_description"], response=response)

    flask.session["github_auth_secret"] = data["access_token"]

    return flask.redirect(url_to_redirect)
