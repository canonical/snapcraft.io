# Packages
import flask
from canonicalwebteam.store_api.stores.snapstore import SnapPublisher
from canonicalwebteam.store_api.exceptions import StoreApiResponseErrorList

# Local
from webapp.helpers import api_publisher_session
from webapp.decorators import login_required

publisher_api = SnapPublisher(api_publisher_session)


@login_required
def redirect_get_release_history(snap_name):
    return flask.redirect(
        flask.url_for(".get_release_history", snap_name=snap_name)
    )


@login_required
def get_release_history(snap_name):
    release_history = publisher_api.snap_release_history(
        flask.session, snap_name
    )

    channel_map = publisher_api.snap_channel_map(flask.session, snap_name)

    snap = channel_map.get("snap", {})

    context = {
        "snap_name": snap_name,
        "snap_title": snap.get("title"),
        "publisher_name": snap.get("publisher", {}).get("display-name", {}),
        "release_history": release_history,
        "private": snap.get("private"),
        "default_track": snap.get("default-track"),
        "channel_map": channel_map.get("channel-map"),
        "tracks": snap.get("tracks"),
    }

    return flask.render_template("publisher/release-history.html", **context)


@login_required
def redirect_post_release(snap_name):
    return flask.redirect(
        flask.url_for(".post_release", snap_name=snap_name), 307
    )


@login_required
def get_release_history_json(snap_name):
    page = flask.request.args.get("page", default=1, type=int)

    try:
        release_history = publisher_api.snap_release_history(
            flask.session, snap_name, page
        )
    except StoreApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return flask.jsonify(api_response_error_list.errors), 400

    return flask.jsonify(release_history)


@login_required
def post_release(snap_name):
    data = flask.request.json

    if not data:
        response = {"errors": ["No changes were submitted"]}
        return flask.jsonify(response), 400

    try:
        response = publisher_api.post_snap_release(
            flask.session, snap_name, data
        )
    except StoreApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            response = {
                "errors": api_response_error_list,
            }
            return flask.jsonify(response), 400

    return flask.jsonify(response)


@login_required
def redirect_post_close_channel(snap_name):
    return flask.redirect(
        flask.url_for(".post_close_channel", snap_name=snap_name), 307
    )


@login_required
def post_close_channel(snap_name):
    data = flask.request.json

    if not data:
        return flask.jsonify({}), 400

    try:
        snap_id = publisher_api.get_snap_id(snap_name, flask.session)
    except StoreApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return flask.jsonify(api_response_error_list.errors), 400

    try:
        response = publisher_api.post_close_channel(
            flask.session, snap_id, data
        )
    except StoreApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            response = {
                "errors": api_response_error_list.errors,
                "success": False,
            }
            return flask.jsonify(response), 400

    response["success"] = True
    return flask.jsonify(response)


@login_required
def post_default_track(snap_name):
    data = flask.request.json

    if not data:
        return flask.jsonify({}), 400

    try:
        snap_id = publisher_api.get_snap_id(snap_name, flask.session)
    except StoreApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return flask.jsonify(api_response_error_list.errors), 400

    try:
        publisher_api.snap_metadata(snap_id, flask.session, data)
    except StoreApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            response = {
                "errors": api_response_error_list.errors,
                "success": False,
            }
            return flask.jsonify(response), 400

    return flask.jsonify({"success": True})


@login_required
def get_snap_revision_json(snap_name, revision):
    """
    Return JSON object from the publisher API
    """
    revision = publisher_api.get_snap_revision(
        flask.session, snap_name, revision
    )

    return flask.jsonify(revision)
