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
    "admin-dashboard",
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
                ])
    snaps_results = []
    next = True
    while next:
        featured_snaps = admin_api.get_featured_snaps(flask.session, fields=fields)
        snaps_results.extend(
            featured_snaps.get("_embedded", {}).get("clickindex:package", [])
        )
        next = featured_snaps.get("_links", {}).get("next", False)

    for snap in snaps_results:
        snap["icon_url"] = helpers.get_icon(snap["media"])


    return flask.jsonify(snaps_results)


@admin_dashboard.route("/api/featured-snaps", methods=["POST"])
@login_required
@exchange_required
@admin_required
def post_featured_snaps():
    """
    In this view, we do three things:
    1. Fetch all currently featured snaps
    2. Delete the currently featured snaps
    3. Update featured snaps to be newly featured

    Args:
        None

    Returns:
        dict: A dictionary containing the response message and success status.
    """

    # new_featured_snaps is the list of featured snaps to be updated
    featured_snaps = flask.request.form.get("snaps")
    if not featured_snaps:
        response = {
            "success": False,
            "message": "Snaps cannot be empty",
        }
        return flask.make_response(response, 500)
    new_featured_snaps = featured_snaps.split(",")

    # currently_featured_snap is the list of featured snaps to be deleted
    currently_featured_snaps = []

    # 1. Fetch all currently featured snaps
    next = True
    while next:
        featured_snaps = admin_api.get_featured_snaps(flask.session)
        currently_featured_snaps.extend(
            featured_snaps.get("_embedded", {}).get("clickindex:package", [])
        )
        next = featured_snaps.get("_links", {}).get("next", False)

    currently_featured_snap_ids = [
        snap["snap_id"] for snap in currently_featured_snaps
    ]

    # 2. Delete the currently featured snaps
    delete_response = admin_api.delete_featured_snaps(
        flask.session, {"packages": currently_featured_snap_ids}
    )
    if delete_response.status_code != 201:
        response = {
            "success": False,
            "message": "An error occurred while deleting featured snaps",
        }
        return flask.make_response(response, 500)
    
    # 3. Update featured snaps to be newly featured
    snap_ids = [
        publisher_api.get_snap_id(snap_name, flask.session)
        for snap_name in new_featured_snaps
    ]

    update_response = admin_api.update_featured_snaps(
        flask.session, {"packages": snap_ids}
    )
    if update_response.status_code != 201:
        response = {
            "success": False,
            "message": "An error occured while updating featured snaps",
        }
        return flask.make_response(response, 500)
    return flask.make_response({"success": True}, 200)
