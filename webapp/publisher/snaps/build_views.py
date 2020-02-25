# Standard library
import os
from hashlib import md5

# Packages
import flask
import talisker.requests
from canonicalwebteam.launchpad import Launchpad

# Local
import webapp.api.dashboard as api
from webapp.api.exceptions import ApiError, ApiResponseErrorList
from webapp.api.github import GitHub
from webapp.decorators import login_required
from webapp.extensions import csrf
from webapp.publisher.snaps.builds import map_build_and_upload_states
from webapp.publisher.views import _handle_error, _handle_error_list
from werkzeug.exceptions import Unauthorized

GITHUB_SNAPCRAFT_USER_TOKEN = os.getenv("GITHUB_SNAPCRAFT_USER_TOKEN")
BUILDS_PER_PAGE = 15
launchpad = Launchpad(
    username=os.getenv("LP_API_USERNAME"),
    token=os.getenv("LP_API_TOKEN"),
    secret=os.getenv("LP_API_TOKEN_SECRET"),
    session=talisker.requests.get_session(),
)


def get_builds(lp_snap, context, selection):
    # Git repository without GitHub hostname
    context["github_repository"] = lp_snap["git_repository_url"][19:]

    builds = launchpad.get_collection_entries(
        # Remove first part of the URL
        lp_snap["builds_collection_link"][32:]
    )

    context["total_builds"] = len(builds)

    builds = builds[selection]

    context["snap_builds_enabled"] = bool(builds)

    for build in builds:
        status = map_build_and_upload_states(
            build["buildstate"], build["store_upload_status"]
        )

        context["snap_builds"].append(
            {
                "id": build["self_link"].split("/")[-1],
                "arch_tag": build["arch_tag"],
                "datebuilt": build["datebuilt"],
                "duration": build["duration"],
                "logs": build["build_log_url"],
                "revision_id": build["revision_id"],
                "status": status,
                "title": build["title"],
            }
        )

    return context


@login_required
def get_snap_builds(snap_name):
    try:
        details = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

    context = {
        "snap_id": details["snap_id"],
        "snap_name": details["snap_name"],
        "snap_title": details["title"],
        "snap_builds_enabled": False,
        "snap_builds": [],
        "total_builds": 0,
    }

    # Get built snap in launchpad with this store name
    github = GitHub(flask.session.get("github_auth_secret"))
    lp_snap = launchpad.get_snap_by_store_name(details["snap_name"])

    if lp_snap:
        # Git repository without GitHub hostname
        context["github_repository"] = lp_snap["git_repository_url"][19:]
        github_owner, github_repo = context["github_repository"].split("/")

        context["yaml_file_exists"] = github.get_snapcraft_yaml_location(
            github_owner, github_repo
        )

        if not context["yaml_file_exists"]:
            flask.flash(
                "This repository doesn't contain a snapcraft.yaml", "negative"
            )
        context = get_builds(lp_snap, context, None, slice(0, BUILDS_PER_PAGE))
    else:
        try:
            context["github_user"] = github.get_user()
        except Unauthorized:
            context["github_user"] = None

        if context["github_user"]:
            context["github_orgs"] = github.get_orgs()

    return flask.render_template("publisher/builds.html", **context)


@login_required
def get_snap_build(snap_name, build_id):
    try:
        details = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

    context = {
        "snap_id": details["snap_id"],
        "snap_name": details["snap_name"],
        "snap_title": details["title"],
        "snap_build": {},
    }

    # Get build by snap name and build_id
    lp_build = launchpad.get_snap_build(details["snap_name"], build_id)

    if lp_build:
        status = map_build_and_upload_states(
            lp_build["buildstate"], lp_build["store_upload_status"]
        )
        context["snap_build"] = {
            "id": lp_build["self_link"].split("/")[-1],
            "arch_tag": lp_build["arch_tag"],
            "datebuilt": lp_build["datebuilt"],
            "duration": lp_build["duration"],
            "logs": lp_build["build_log_url"],
            "revision_id": lp_build["revision_id"],
            "status": status,
            "title": lp_build["title"],
        }

        if context["snap_build"]["logs"]:
            context["raw_logs"] = launchpad.get_snap_build_log(
                details["snap_name"], build_id
            )

    return flask.render_template("publisher/build.html", **context)


def validate_repo(github_token, snap_name, gh_owner, gh_repo):
    github = GitHub(github_token)
    result = {"success": True}
    yaml_location = github.get_snapcraft_yaml_location(gh_owner, gh_repo)

    # The snapcraft.yaml is not present
    if not yaml_location:
        result["success"] = False
        result["error"] = {
            "type": "MISSING_YAML_FILE",
            "message": (
                "Missing snapcraft.yaml: this repo needs a snapcraft.yaml "
                "file, so that Snapcraft can make it buildable, installable "
                "and runnable."
            ),
        }
    # The property name inside the yaml file doesn't match the snap
    else:
        gh_snap_name = github.get_snapcraft_yaml_name(gh_owner, gh_repo)

        if gh_snap_name != snap_name:
            result["success"] = False
            result["error"] = {
                "type": "SNAP_NAME_DOES_NOT_MATCH",
                "message": (
                    'Name mismatch: the snapcraft.yaml uses the snap name "'
                    + gh_snap_name
                    + '", but you\'ve registered the name "'
                    + snap_name
                    + '". Update your '
                    "snapcraft.yaml to continue."
                ),
                "yaml_location": yaml_location,
                "gh_snap_name": gh_snap_name,
            }

    return result


@login_required
def get_snap_builds_json(snap_name):
    try:
        details = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

    context = {"snap_builds_enabled": False, "snap_builds": []}

    start = flask.request.args.get("start", 0, type=int)
    size = flask.request.args.get("size", 15, type=int)
    build_slice = slice(start, start + size)

    # Get built snap in launchpad with this store name
    lp_snap = launchpad.get_snap_by_store_name(details["snap_name"])

    if lp_snap:
        context = get_builds(lp_snap, context, None, build_slice)

    return flask.jsonify(context)


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

    owner, repo = flask.request.args.get("repo").split("/")

    return flask.jsonify(
        validate_repo(
            flask.session.get("github_auth_secret"),
            details["snap_name"],
            owner,
            repo,
        )
    )


@login_required
def post_snap_builds(snap_name):
    try:
        details = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

    redirect_url = flask.url_for(".get_snap_builds", snap_name=snap_name)

    # Get built snap in launchpad with this store name
    github = GitHub(flask.session.get("github_auth_secret"))
    owner, repo = flask.request.form.get("github_repository").split("/")

    if not github.check_permissions_over_repo(owner, repo):
        flask.flash(
            "Your GitHub account doesn't have permissions in the repository",
            "negative",
        )
        return flask.redirect(redirect_url)

    repo_validation = validate_repo(
        flask.session.get("github_auth_secret"), snap_name, owner, repo
    )

    if not repo_validation["success"]:
        flask.flash(repo_validation["error"]["message"], "negative")
        return flask.redirect(redirect_url)

    lp_snap = launchpad.get_snap_by_store_name(details["snap_name"])
    git_url = f"https://github.com/{owner}/{repo}"

    if not lp_snap:
        launchpad.create_snap(snap_name, git_url)

        # Create webhook in the repo
        github.create_hook(
            owner, repo, f"https://snapcraft.io/{snap_name}/webhook/notify"
        )

        # We trigger a first build
        launchpad.build_snap(details["snap_name"])

        flask.flash("The GitHub repository was linked correctly.", "positive")
    elif lp_snap["git_repository_url"] != git_url:
        # In the future, create a new record, delete the old one
        raise AttributeError(
            f"Snap {snap_name} already has a build repository associated"
        )

    return flask.redirect(redirect_url)


@login_required
def post_build(snap_name):
    try:
        details = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

    launchpad.build_snap(details["snap_name"])

    return flask.redirect(
        flask.url_for(".get_snap_builds", snap_name=snap_name)
    )


@csrf.exempt
def post_github_webhook(snap_name=None, github_owner=None, github_repo=None):
    repo_url = flask.request.json["repository"]["url"]
    gh_owner = flask.request.json["repository"]["owner"]["login"]
    gh_repo = flask.request.json["repository"]["name"]

    if snap_name:
        lp_snap = launchpad.get_snap_by_store_name(snap_name)
    else:
        lp_snap = launchpad.get_snap(md5(repo_url.encode("UTF-8")).hexdigest())

    # Check that this is the repo for this snap
    if lp_snap["git_repository_url"] != repo_url:
        return ("The repository does not match the one used by this Snap", 403)

    github = GitHub()
    valid_secret = github.gen_webhook_secret(gh_owner, gh_repo)

    if valid_secret != flask.request.headers.get("X-Hub-Signature").replace(
        "sha1=", ""
    ):
        return ("Invalid secret", 403)

    validation = validate_repo(
        GITHUB_SNAPCRAFT_USER_TOKEN, lp_snap["store_name"], gh_owner, gh_repo
    )

    if not validation["success"]:
        return (validation["error"]["message"], 400)

    launchpad.build_snap(lp_snap["store_name"])

    return ("", 204)


@login_required
def post_update_gh_webhooks(snap_name):
    try:
        details = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_error(api_error)

    lp_snap = launchpad.get_snap_by_store_name(details["snap_name"])
    gh_link = lp_snap["git_repository_url"][19:]
    gh_owner, gh_repo = gh_link.split("/")

    github = GitHub(flask.session.get("github_auth_secret"))
    old_url = f"https://build.snapcraft.io/{gh_owner}/{gh_repo}/webhook/notify"
    old_hook = github.get_hook_by_url(gh_owner, gh_repo, old_url)

    if old_hook:
        github.update_hook_url(
            gh_owner,
            gh_repo,
            old_hook["id"],
            f"https://snapcraft.io/{snap_name}/webhook/notify",
        )

    return flask.redirect(
        flask.url_for(".get_snap_builds", snap_name=snap_name)
    )
