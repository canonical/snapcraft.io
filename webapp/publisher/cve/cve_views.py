import json

import flask
from canonicalwebteam.store_api.stores.snapstore import SnapPublisher

from webapp.helpers import api_publisher_session
from webapp.decorators import login_required
from webapp.publisher.cve.cve_helper import CveHelper
from webapp.publisher.snaps import (
    logic,
)
publisher_api = SnapPublisher(api_publisher_session)

@login_required
def get_cves(snap_name, revision):
    snap_details = publisher_api.get_snap_info(snap_name, flask.session)
    snap_store = snap_details['store']
    snap_publisher = snap_details['publisher']


    account_info = publisher_api.get_account(flask.session)

    admin_user_stores = logic.get_stores(
        account_info["stores"], roles=["admin"]
    )
    is_user_admin = [item for item in admin_user_stores if item["name"] == snap_store] 

    GLOBAL_STORE= "Global"
    is_snap_in_global_store = snap_store == GLOBAL_STORE

    # check if the snap is publised by canonical
    CANONICAL_PUBLISHER_ID = 'canonical'
    is_snap_publisher_canonical = snap_publisher["id"] == CANONICAL_PUBLISHER_ID

    # check if the user is the publisher
    is_user_snap_publisher = snap_publisher["username"] == account_info["username"]

    # check if user canonical
    is_user_canonical = flask.session["publisher"].get(
        "is_canonical", False
    )
    is_user_collaborator = snap_name in account_info["snaps"]["16"] 

    can_view_cves = False
    if is_user_snap_publisher or is_user_admin:
        can_view_cves = True
    elif is_snap_in_global_store:
        if is_snap_publisher_canonical:
            if is_user_canonical or is_user_collaborator:
                can_view_cves = True
        elif is_user_collaborator:
            can_view_cves = True

    # add permission check
    if not can_view_cves:
        return flask.jsonify({"error": "User is not allowed to see snap's CVE data.".format(revision, snap_name)}), 403  


    # add query param filters, pagination, sort
    cve = CveHelper()
    cves = cve.get_cve_with_revision(snap_name, revision)
    # print(json.dumps({"cves": cves}, indent=4))

 
    return flask.jsonify({"success": True, "data": cves})