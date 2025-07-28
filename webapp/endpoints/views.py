# Packages
import flask
from canonicalwebteam.store_api.dashboard import Dashboard
from flask.json import jsonify

# Local
from webapp.decorators import login_required, exchange_required
from webapp.helpers import api_session


dashboard = Dashboard(api_session)

endpoints = flask.Blueprint(
    "endpoints",
    __name__,
)


@endpoints.route("/api/stores")
@login_required
@exchange_required
def get_stores():
    """
    In this view we get all the stores the user has access to or we show a 403
    """
    stores = dashboard.get_stores(flask.session)

    res = {"success": True, "data": stores}

    return jsonify(res)
