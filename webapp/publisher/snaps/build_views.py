import flask

import webapp.api.dashboard as api
from webapp.api.exceptions import ApiError, ApiResponseErrorList
from webapp.api.github import GitHubAPI
from webapp.decorators import login_required
from webapp.publisher.views import _handle_error, _handle_error_list


@login_required
def get_validate_repo(snap_name):
    try:
        details = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

    github = GitHubAPI(flask.session.get("github_auth_secret"))
    owner, repo = flask.request.args.get("repo").split("/")
    response = {"success": True}

    # The yaml is not present
    if not github.get_snapcraft_yaml_location(owner, repo):
        response["success"] = False
        response["error"] = "MISSING_YAML_FILE"
    # The property name inside the yaml file doesn't match the snap
    elif not github.check_snapcraft_yaml_name(
        owner, repo, details["snap_name"]
    ):
        response["success"] = False
        response["error"] = "SNAP_NAME_DOES_NOT_MATCH"

    return flask.jsonify(response)
