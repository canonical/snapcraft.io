import flask
from flask.json import jsonify
from canonicalwebteam.store_api.dashboard import Dashboard

# Local
from webapp.decorators import login_required, exchange_required
from webapp.helpers import api_session

dashboard = Dashboard(api_session)

snap_search = flask.Blueprint("snap_search", __name__)


@snap_search.route("/api/<store_id>/snaps/search")
@login_required
@exchange_required
def get_snaps_search(store_id):
    snaps = dashboard.get_store_snaps(
        flask.session,
        store_id,
        flask.request.args.get("q"),
        flask.request.args.get("allowed_for_inclusion"),
    )

    return jsonify(snaps)
