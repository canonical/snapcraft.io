# Packages
import talisker.requests
import flask

from canonicalwebteam.store_api.stores.snapstore import (
    SnapStore,
    SnapStoreAdmin,
    SnapPublisher,
)

# Local
from webapp.api import requests
from webapp import helpers
from webapp.decorators import login_required, admin_required, exchange_required
from webapp.helpers import api_publisher_session

admin_dashboard = flask.Blueprint(
    "admin_dashboard",
    __name__,
    template_folder="/templates",
    static_folder="/static",
)

session = talisker.requests.get_session(requests.Session)
api = SnapStore(session, None)

admin_api = SnapStoreAdmin(api_publisher_session)
publisher_api = SnapPublisher(api_publisher_session)


@admin_dashboard.route("/")
@login_required
@exchange_required
@admin_required
def featured_snaps():
    return flask.render_template("admin-dashboard.html")


@admin_dashboard.route("/api/featured-snaps", methods=["GET"])
@login_required
@admin_required
def get_featured_snaps():
    fields = ",".join(
        [
            "package_name",
            "title",
            "summary",
            "architecture",
            "media",
            "developer_name",
            "developer_id",
            "developer_validation",
            "origin",
            "apps",
            "sections",
            "snap_id",
        ]
    )
    snaps_results = []
    next = True
    while next:
        featured_snaps = admin_api.get_featured_snaps(
            flask.session, fields=fields
        )
        snaps_results.extend(
            featured_snaps.get("_embedded", {}).get("clickindex:package", [])
        )
        next = featured_snaps.get("_links", {}).get("next", False)

    for snap in snaps_results:
        snap["icon_url"] = helpers.get_icon(snap["media"])

    return flask.jsonify(snaps_results)
