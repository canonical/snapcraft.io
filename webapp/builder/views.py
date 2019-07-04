import secrets

import flask

from webapp.api import github
from webapp.builder.exceptions import GithubAuthException
from webapp.database import db
from webapp.models.user import User

builder = flask.Blueprint(
    "builder", __name__, template_folder="/templates", static_folder="/static"
)


@builder.route("/")
def index():
    return flask.render_template("builder/index.html")


@builder.route("/auth/authenticate")
def authenticate():
    secret = secrets.token_urlsafe(48)
    flask.session["github_auth_secret"] = secret

    oauth_url = github.get_oauth_url(
        f"{flask.request.url_root[0:-1]}{flask.url_for('builder.verify')}",
        secret,
    )

    return flask.redirect(oauth_url)


@builder.route("/auth/verify", methods=["GET", "POST"])
def verify():
    # Verify secret matches our copy and warn about potential CSRF attack
    secret = flask.request.args.get("state")
    session_secret = flask.session.get("github_auth_secret")

    if not session_secret or secret != session_secret:
        raise GithubAuthException(
            "Returned secret does not match generated secret."
        )

    # Ask github for the auth token
    code = flask.request.args.get("code")
    response = github.exchange_code_for_token(code)

    data = {}
    try:
        data = response.json()
    except ValueError:
        pass

    if not response.ok or "error" in data or "access_token" not in data:
        raise GithubAuthException("Authentication token exchange failed.")

    token = data["access_token"]
    github_user = github.get_authenticated_user(token).json()

    # Create or update user
    email = flask.session["openid"]["email"]
    user = db.query(User).filter(User.email == email).first()

    if user:
        user.github_name = github_user["name"]
        user.github_username = github_user["login"]
        user.github_token = token
    else:
        user = User(
            email=email,
            github_name=github_user["name"],
            github_username=github_user["login"],
            github_token=token,
        )

    db.add(user)
    db.commit()

    flask.flash("GitHub account connected.", "positive")

    return flask.redirect(flask.url_for("account.get_account_details"))


@builder.route("/auth/disconnect")
def disconnect():
    email = flask.session["openid"]["email"]
    db.query(User).filter(User.email == email).update(
        {
            User.github_name: None,
            User.github_token: None,
            User.github_username: None,
        }
    )
    db.commit()

    flask.flash("GitHub account disconnected.", "positive")
    return flask.redirect(flask.url_for("account.get_account_details"))


@builder.errorhandler(GithubAuthException)
def github_auth_exception_handler(e):
    flask.flash(f"{e}", "negative")
    return flask.redirect(flask.url_for("account.get_account_details"))
