# Packages
import flask

# Local
from webapp.api import dashboard as api
from webapp.api.exceptions import ApiError, ApiResponseErrorList
from webapp.decorators import login_required
from webapp.publisher.views import _handle_error, _handle_error_list


@login_required
def redirect_get_release_history(snap_name):
    return flask.redirect(
        flask.url_for(".get_release_history", snap_name=snap_name)
    )


@login_required
def get_release_history(snap_name):
    try:
        release_history = api.snap_release_history(flask.session, snap_name)
    except ApiResponseErrorList as api_response_error_list:
        return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

    try:
        channel_map = api.snap_channel_map(flask.session, snap_name)
    except ApiResponseErrorList as api_response_error_list:
        return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

    snap = channel_map.get("snap", {})

    context = {
        "snap_name": snap_name,
        "snap_title": snap.get("title"),
        "publisher_name": snap.get("publisher", {}).get("display-name", {}),
        "release_history": release_history,
        "private": snap.get("private"),
        "default_track": snap.get("default-track"),
        "channel_map": channel_map.get("channel-map"),
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
        release_history = api.snap_release_history(
            flask.session, snap_name, page
        )
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return flask.jsonify(api_response_error_list.errors), 400
    except ApiError as api_error:
        return _handle_error(api_error)

    return flask.jsonify(release_history)


@login_required
def post_release(snap_name):
    data = flask.request.json

    if not data:
        return flask.jsonify({}), 400

    try:
        response = api.post_snap_release(flask.session, snap_name, data)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return flask.jsonify(api_response_error_list.errors), 400
    except ApiError as api_error:
        return _handle_error(api_error)

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
        snap_id = api.get_snap_id(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return flask.jsonify(api_response_error_list.errors), 400
    except ApiError as api_error:
        return _handle_error(api_error)

    try:
        response = api.post_close_channel(flask.session, snap_id, data)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            response = {
                "errors": api_response_error_list.errors,
                "success": False,
            }
            return flask.jsonify(response), 400
    except ApiError as api_error:
        return _handle_error(api_error)

    response["success"] = True
    return flask.jsonify(response)


@login_required
def post_default_track(snap_name):
    data = flask.request.json

    if not data:
        return flask.jsonify({}), 400

    try:
        snap_id = api.get_snap_id(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return flask.jsonify(api_response_error_list.errors), 400
    except ApiError as api_error:
        return _handle_error(api_error)

    try:
        api.snap_metadata(snap_id, flask.session, data)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            response = {
                "errors": api_response_error_list.errors,
                "success": False,
            }
            return flask.jsonify(response), 400
    except ApiError as api_error:
        return _handle_error(api_error)

    return flask.jsonify({"success": True})
