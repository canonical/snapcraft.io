# Standard library
import os
from hashlib import md5

# Packages
import flask
from canonicalwebteam.store_api.stores.snapstore import SnapPublisher

from requests.exceptions import HTTPError

# Local
from webapp.helpers import api_publisher_session, launchpad
from webapp.api.github import GitHub, InvalidYAML
from webapp.decorators import login_required
from webapp.extensions import csrf
from webapp.publisher.snaps.builds import map_build_and_upload_states
from werkzeug.exceptions import Unauthorized

GITHUB_SNAPCRAFT_USER_TOKEN = os.getenv("GITHUB_SNAPCRAFT_USER_TOKEN")
GITHUB_WEBHOOK_HOST_URL = os.getenv("GITHUB_WEBHOOK_HOST_URL")
BUILDS_PER_PAGE = 15
publisher_api = SnapPublisher(api_publisher_session)


def get_builds(lp_snap, selection):
    builds = launchpad.get_snap_builds(lp_snap["store_name"])

    total_builds = len(builds)

    builds = builds[selection]

    snap_builds = []
    builders_status = None

    for build in builds:
        status = map_build_and_upload_states(
            build["buildstate"], build["store_upload_status"]
        )

        snap_build = {
            "id": build["self_link"].split("/")[-1],
            "arch_tag": build["arch_tag"],
            "datebuilt": build["datebuilt"],
            "duration": build["duration"],
            "logs": build["build_log_url"],
            "revision_id": build["revision_id"],
            "status": status,
            "title": build["title"],
            "queue_time": None,
        }

        if build["buildstate"] == "Needs building":
            if not builders_status:
                builders_status = launchpad.get_builders_status()

            snap_build["queue_time"] = builders_status[build["arch_tag"]][
                "estimated_duration"
            ]

        snap_builds.append(snap_build)

    return {
        "total_builds": total_builds,
        "snap_builds": snap_builds,
    }


@login_required
def get_snap_repo(snap_name):
    res = {"message": "", "success": True}
    data = {"github_orgs": [], "github_repository": None, "github_user": None}

    details = publisher_api.get_snap_info(snap_name, flask.session)

    # API call to make users without needed permissions refresh the session
    # Users needs package_upload_request permission to use this feature
    publisher_api.get_package_upload_macaroon(
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


@login_required
def get_snap_builds_page(snap_name):
    return flask.render_template("store/publisher.html", snap_name=snap_name)


@login_required
def get_snap_build_page(snap_name, build_id):
    return flask.render_template(
        "store/publisher.html", snap_name=snap_name, build_id=build_id
    )


@login_required
def get_snap_builds(snap_name):
    res = {"message": "", "success": True}
    data = {"snap_builds": [], "total_builds": 0}

    details = publisher_api.get_snap_info(snap_name, flask.session)
    start = flask.request.args.get("start", 0, type=int)
    size = flask.request.args.get("size", 15, type=int)
    build_slice = slice(start, size)

    # Get built snap in launchpad with this store name
    lp_snap = launchpad.get_snap_by_store_name(details["snap_name"])

    if lp_snap:
        data.update(get_builds(lp_snap, build_slice))

    res["data"] = data

    return flask.jsonify(res)


@login_required
def get_snap_build(snap_name, build_id):
    details = publisher_api.get_snap_info(snap_name, flask.session)

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

    return flask.jsonify({"data": context, "success": True})


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
    details = publisher_api.get_snap_info(snap_name, flask.session)

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
    details = publisher_api.get_snap_info(snap_name, flask.session)

    # Don't allow changes from Admins that are no contributors
    account_snaps = publisher_api.get_account_snaps(flask.session)

    if snap_name not in account_snaps:
        flask.flash(
            "You do not have permissions to modify this Snap", "negative"
        )
        return flask.redirect(
            flask.url_for(".get_snap_builds", snap_name=snap_name)
        )

    redirect_url = flask.url_for(".get_snap_builds", snap_name=snap_name)

    # Get built snap in launchpad with this store name
    github = GitHub(flask.session.get("github_auth_secret"))
    owner, repo = flask.request.form.get("github_repository").split("/")

    if not github.check_permissions_over_repo(owner, repo):
        flask.flash(
            "The repository doesn't exist or you don't have"
            " enough permissions",
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
        lp_snap_name = md5(git_url.encode("UTF-8")).hexdigest()

        try:
            repo_exist = launchpad.get_snap(lp_snap_name)
        except HTTPError as e:
            if e.response.status_code == 404:
                repo_exist = False
            else:
                raise e

        if repo_exist:
            flask.flash(
                "The specified repository is being used by another snap:"
                f" {repo_exist['store_name']}",
                "negative",
            )
            return flask.redirect(redirect_url)

        macaroon = publisher_api.get_package_upload_macaroon(
            session=flask.session, snap_name=snap_name, channels=["edge"]
        )["macaroon"]

        launchpad.create_snap(snap_name, git_url, macaroon)

        flask.flash(
            "The GitHub repository was linked successfully.", "positive"
        )

        # Create webhook in the repo, it should also trigger the first build
        github_hook_url = (
            f"{GITHUB_WEBHOOK_HOST_URL}{snap_name}/webhook/notify"
        )
        try:
            hook = github.get_hook_by_url(owner, repo, github_hook_url)

            # We create the webhook if doesn't exist already in this repo
            if not hook:
                github.create_hook(owner, repo, github_hook_url)
        except HTTPError:
            flask.flash(
                "The GitHub Webhook could not be created. "
                "Please trigger a new build manually.",
                "caution",
            )

    elif lp_snap["git_repository_url"] != git_url:
        # In the future, create a new record, delete the old one
        raise AttributeError(
            f"Snap {snap_name} already has a build repository associated"
        )

    return flask.redirect(redirect_url)


@login_required
def post_build(snap_name):
    # Don't allow builds from no contributors
    account_snaps = publisher_api.get_account_snaps(flask.session)

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
        # Timeout or not found from Launchpad
        if e.response.status_code in [408, 404]:
            return flask.jsonify(
                {
                    "success": False,
                    "error": {
                        "message": "An error happened building "
                        "this snap, please try again."
                    },
                }
            )
        raise e

    return flask.jsonify({"success": True, "build_id": build_id})


@login_required
def check_build_request(snap_name, build_id):
    # Don't allow builds from no contributors
    account_snaps = publisher_api.get_account_snaps(flask.session)

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
        response = launchpad.get_snap_build_request(snap_name, build_id)
    except HTTPError as e:
        # Timeout or not found from Launchpad
        if e.response.status_code in [408, 404]:
            return flask.jsonify(
                {
                    "success": False,
                    "error": {
                        "message": "An error happened building "
                        "this snap, please try again."
                    },
                }
            )
        raise e

    error_message = None
    if response["error_message"]:
        error_message = response["error_message"].split(" HEAD:")[0]

    return flask.jsonify(
        {
            "success": True,
            "status": response["status"],
            "error": {"message": error_message},
        }
    )


@login_required
def post_disconnect_repo(snap_name):
    details = publisher_api.get_snap_info(snap_name, flask.session)

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
                f"{GITHUB_WEBHOOK_HOST_URL}{snap_name}/webhook/notify",
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


@csrf.exempt
def post_github_webhook(snap_name=None, github_owner=None, github_repo=None):
    payload = flask.request.json
    repo_url = payload["repository"]["html_url"]
    gh_owner = payload["repository"]["owner"]["login"]
    gh_repo = payload["repository"]["name"]
    gh_default_branch = payload["repository"]["default_branch"]

    # The first payload after the webhook creation
    # doesn't contain a "ref" key
    if "ref" in payload:
        gh_event_branch = payload["ref"][11:]
    else:
        gh_event_branch = gh_default_branch

    # Check the push event is in the default branch
    if gh_default_branch != gh_event_branch:
        return ("The push event is not for the default branch", 200)

    if snap_name:
        lp_snap = launchpad.get_snap_by_store_name(snap_name)
    else:
        lp_snap = launchpad.get_snap(md5(repo_url.encode("UTF-8")).hexdigest())

    if not lp_snap:
        return ("This repository is not linked with any Snap", 403)

    # Check that this is the repo for this snap
    if lp_snap["git_repository_url"] != repo_url:
        return ("The repository does not match the one used by this Snap", 403)

    github = GitHub()

    signature = flask.request.headers.get("X-Hub-Signature")

    if not github.validate_webhook_signature(flask.request.data, signature):
        if not github.validate_bsi_webhook_secret(
            gh_owner, gh_repo, flask.request.data, signature
        ):
            return ("Invalid secret", 403)

    validation = validate_repo(
        GITHUB_SNAPCRAFT_USER_TOKEN, lp_snap["store_name"], gh_owner, gh_repo
    )

    if not validation["success"]:
        return (validation["error"]["message"], 400)

    if launchpad.is_snap_building(lp_snap["store_name"]):
        launchpad.cancel_snap_builds(lp_snap["store_name"])

    launchpad.build_snap(lp_snap["store_name"])

    return ("", 204)


@login_required
def get_update_gh_webhooks(snap_name):
    details = publisher_api.get_snap_info(snap_name, flask.session)

    lp_snap = launchpad.get_snap_by_store_name(details["snap_name"])

    if not lp_snap:
        flask.flash(
            "This snap is not linked with a GitHub repository", "negative"
        )

        return flask.redirect(
            flask.url_for(".get_settings", snap_name=snap_name)
        )

    github = GitHub(flask.session.get("github_auth_secret"))

    try:
        github.get_user()
    except Unauthorized:
        return flask.redirect(f"/github/auth?back={flask.request.path}")

    gh_link = lp_snap["git_repository_url"][19:]
    gh_owner, gh_repo = gh_link.split("/")

    try:
        # Remove old BSI webhook if present
        old_url = (
            f"https://build.snapcraft.io/{gh_owner}/{gh_repo}/webhook/notify"
        )
        old_hook = github.get_hook_by_url(gh_owner, gh_repo, old_url)

        if old_hook:
            github.remove_hook(
                gh_owner,
                gh_repo,
                old_hook["id"],
            )

        # Remove current hook
        github_hook_url = (
            f"{GITHUB_WEBHOOK_HOST_URL}{snap_name}/webhook/notify"
        )
        snapcraft_hook = github.get_hook_by_url(
            gh_owner, gh_repo, github_hook_url
        )

        if snapcraft_hook:
            github.remove_hook(
                gh_owner,
                gh_repo,
                snapcraft_hook["id"],
            )

        # Create webhook in the repo
        github.create_hook(gh_owner, gh_repo, github_hook_url)
    except HTTPError:
        flask.flash(
            "The GitHub Webhook could not be created. "
            "Please try again or check your permissions over the repository.",
            "caution",
        )
    else:
        flask.flash("The webhook has been created successfully", "positive")

    return flask.redirect(flask.url_for(".get_settings", snap_name=snap_name))
