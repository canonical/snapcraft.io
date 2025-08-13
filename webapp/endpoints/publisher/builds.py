# Standard library
import os

# Packages
import flask
from canonicalwebteam.store_api.dashboard import Dashboard

from requests.exceptions import HTTPError

# Local
from webapp.helpers import api_publisher_session, launchpad
from webapp.api.github import GitHub, InvalidYAML
from webapp.decorators import login_required

GITHUB_WEBHOOK_HOST_URL = os.getenv("GITHUB_WEBHOOK_HOST_URL")

dashboard = Dashboard(api_publisher_session)


@login_required
def get_snap_build_page(snap_name, build_id):
    # If this fails, the page will 404
    dashboard.get_snap_info(flask.session, snap_name)
    return flask.render_template(
        "store/publisher.html", snap_name=snap_name, build_id=build_id
    )


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
        try:
            gh_snap_name = github.get_snapcraft_yaml_data(
                gh_owner, gh_repo
            ).get("name")

            if gh_snap_name != snap_name:
                result["success"] = False
                result["error"] = {
                    "type": "SNAP_NAME_DOES_NOT_MATCH",
                    "message": (
                        "Name mismatch: the snapcraft.yaml uses the snap "
                        f'name "{gh_snap_name}", but you\'ve registered'
                        f' the name "{snap_name}". Update your '
                        "snapcraft.yaml to continue."
                    ),
                    "yaml_location": yaml_location,
                    "gh_snap_name": gh_snap_name,
                }
        except InvalidYAML:
            result["success"] = False
            result["error"] = {
                "type": "INVALID_YAML_FILE",
                "message": (
                    "Invalid snapcraft.yaml: there was an issue parsing the "
                    f"snapcraft.yaml for {snap_name}."
                ),
            }

    return result


@login_required
def get_validate_repo(snap_name):
    details = dashboard.get_snap_info(flask.session, snap_name)

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
def post_build(snap_name):
    # Don't allow builds from no contributors
    account_snaps = dashboard.get_account_snaps(flask.session)

    if snap_name not in account_snaps:
        return flask.jsonify(
            {
                "success": False,
                "error": {
                    "type": "FORBIDDEN",
                    "message": "You are not allowed to request "
                    "builds for this snap",
                },
            }
        )

    try:
        if launchpad.is_snap_building(snap_name):
            launchpad.cancel_snap_builds(snap_name)

        build_id = launchpad.build_snap(snap_name)

    except HTTPError as e:
        return flask.jsonify(
            {
                "success": False,
                "error": {
                    "message": "An error happened building "
                    "this snap, please try again."
                },
                "details": e.response.text,
                "status_code": e.response.status_code,
            }
        )

    return flask.jsonify({"success": True, "build_id": build_id})


@login_required
def post_disconnect_repo(snap_name):
    details = dashboard.get_snap_info(flask.session, snap_name)

    lp_snap = launchpad.get_snap_by_store_name(snap_name)
    launchpad.delete_snap(details["snap_name"])

    # Try to remove the GitHub webhook if possible
    if flask.session.get("github_auth_secret"):
        github = GitHub(flask.session.get("github_auth_secret"))

        try:
            gh_owner, gh_repo = lp_snap["git_repository_url"][19:].split("/")

            old_hook = github.get_hook_by_url(
                gh_owner,
                gh_repo,
                f"{GITHUB_WEBHOOK_HOST_URL}api/{snap_name}/webhook/notify",
            )

            if old_hook:
                github.remove_hook(
                    gh_owner,
                    gh_repo,
                    old_hook["id"],
                )
        except HTTPError:
            pass

    return flask.redirect(
        flask.url_for(".get_snap_builds", snap_name=snap_name)
    )
