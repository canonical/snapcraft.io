import time

import flask
from canonicalwebteam.store_api.publishergw import PublisherGW

from webapp import authentication
from webapp.helpers import api_publisher_session

publisher_gateway = PublisherGW("snap", api_publisher_session)


def is_pending_snap_unregister_valid(pending, authorization_id):
    publisher = flask.session.get("publisher", {})
    return (
        pending
        and authentication.is_authenticated(flask.session)
        and pending["authorization_id"] == authorization_id
        and pending["expires_at"] > time.time()
        and pending["identity_url"] == publisher.get("identity_url")
    )


def complete_pending_snap_unregister(resp, authorization_id):
    pending = flask.session.pop("pending_snap_unregister", None)
    if (
        not is_pending_snap_unregister_valid(pending, authorization_id)
        or resp.identity_url != pending["identity_url"]
        or "root_macaroon" not in pending
        or "macaroon" not in resp.extensions
    ):
        flask.flash(
            "Unregister authorization is invalid or expired. "
            "Please try again using the same account.",
            "negative",
        )
        return flask.redirect("/snaps")

    response = publisher_gateway.unregister_package_name(
        {
            "macaroon_root": pending["root_macaroon"],
            "macaroon_discharge": resp.extensions["macaroon"].discharge,
        },
        pending["snap_name"],
    )
    if response.status_code == 200:
        flask.flash(
            f'{pending["snap_name"]} has been unregistered.', "positive"
        )
    else:
        flask.flash(response.json()["error-list"][0]["message"], "negative")
    return flask.redirect("/snaps")
