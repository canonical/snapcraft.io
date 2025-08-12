# Packages
import flask
from canonicalwebteam.store_api.dashboard import Dashboard

# Local
from webapp.helpers import api_publisher_session
from webapp.api.github import GitHub, InvalidYAML
from webapp.decorators import login_required

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
