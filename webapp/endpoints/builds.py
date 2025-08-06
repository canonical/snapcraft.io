# Standard library
import os

# Packages
import flask
from canonicalwebteam.store_api.dashboard import Dashboard


# Local
from webapp.helpers import api_publisher_session, launchpad
from webapp.api.github import GitHub
from webapp.decorators import login_required

GITHUB_SNAPCRAFT_USER_TOKEN = os.getenv("GITHUB_SNAPCRAFT_USER_TOKEN")
GITHUB_WEBHOOK_HOST_URL = os.getenv("GITHUB_WEBHOOK_HOST_URL")
BUILDS_PER_PAGE = 15
dashboard = Dashboard(api_publisher_session)


@login_required
def get_snap_repo(snap_name):
    res = {"message": "", "success": True}
    data = {"github_orgs": [], "github_repository": None, "github_user": None}

    details = dashboard.get_snap_info(flask.session, snap_name)

    # API call to make users without needed permissions refresh the session
    # Users needs package_upload_request permission to use this feature
    dashboard.get_package_upload_macaroon(
        session=flask.session, snap_name=snap_name, channels=["edge"]
    )

    # Get built snap in launchpad with this store name
    lp_snap = launchpad.get_snap_by_store_name(details["snap_name"])

    if lp_snap:
        # In this case we can use the GitHub user account or
        # the Snapcraft GitHub user to check the snapcraft.yaml
        github = GitHub(
            flask.session.get(
                "github_auth_secret", GITHUB_SNAPCRAFT_USER_TOKEN
            )
        )

        # Git repository without GitHub hostname
        data["github_repository"] = lp_snap["git_repository_url"][19:]
        github_owner, github_repo = data["github_repository"].split("/")

        if not github.check_if_repo_exists(github_owner, github_repo):
            data["success"] = False
            data["message"] = "This app has been revoked"

        if github.get_user():
            data["github_user"] = github.get_user()
            data["github_orgs"] = github.get_orgs()

    else:
        data["github_repository"] = None
        github = GitHub(flask.session.get("github_auth_secret"))

        if github.get_user():
            data["github_user"] = github.get_user()
            data["github_orgs"] = github.get_orgs()
        else:
            data["success"] = False
            data["message"] = "Unauthorized"

    res["data"] = data

    return flask.jsonify(res)
