import flask
from webapp.api.github import GitHubAPI
from webapp.decorators import login_required

publisher_github = flask.Blueprint(
    "github", __name__, template_folder="/templates", static_folder="/static"
)


@publisher_github.route("/publisher/github/get-repos", methods=["GET"])
@login_required
def get_repos():
    github = GitHubAPI(flask.session.get("github_auth_secret"))
    repos = github.get_user_repositories()
    return flask.jsonify(repos)


@publisher_github.route("/publisher/github/get-orgs", methods=["GET"])
@login_required
def get_orgs():
    github = GitHubAPI(flask.session.get("github_auth_secret"))
    orgs = github.get_orgs()
    return flask.jsonify(orgs)
