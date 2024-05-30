# Packages
import talisker.requests
import flask

from canonicalwebteam.store_api.stores.snapstore import SnapStore
from canonicalwebteam.store_api.exceptions import StoreApiResponseErrorList

# Local
from webapp.api import requests
import webapp.api.marketo as marketo_api
from webapp.helpers import api_publisher_session
from webapp import helpers
from webapp.decorators import login_required

admin_dashboard = flask.Blueprint(
    "admin-dashboard", __name__, template_folder="/templates", static_folder="/static"
)

session = talisker.requests.get_session(requests.Session)
api = SnapStore(session, None)


@admin_dashboard.route("/")
@login_required
def featured_snaps():
    return flask.render_template(
        "admin-dashboard.html"
    )

@admin_dashboard.route("/api/featured-snaps")
@login_required
def get_featured_snaps():
    snaps_results = []
    snaps_results = api.get_category_items(
        category="featured", size=100, page=1
    )["results"]

    for snap in snaps_results:
        snap["icon_url"] = helpers.get_icon(snap["media"])

    return flask.jsonify(snaps_results)
