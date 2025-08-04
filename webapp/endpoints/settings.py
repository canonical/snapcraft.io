# Packages
import json
import flask
from flask.json import jsonify
from canonicalwebteam.store_api.dashboard import Dashboard

# Local
from webapp.decorators import login_required, exchange_required
from webapp.helpers import api_session


dashboard = Dashboard(api_session)

settings = flask.Blueprint(
    "settings",
    __name__,
)


@settings.route("/api/store/<store_id>/settings", methods=["PUT"])
@login_required
@exchange_required
def post_settings(store_id):
    settings = {}
    settings["private"] = json.loads(flask.request.form.get("private"))
    settings["manual-review-policy"] = flask.request.form.get(
        "manual-review-policy"
    )

    res = {}

    dashboard.change_store_settings(flask.session, store_id, settings)
    res["msg"] = "Changes saved"

    return jsonify({"success": True})
