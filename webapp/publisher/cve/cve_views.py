import json

import flask
from canonicalwebteam.store_api.stores.snapstore import SnapPublisher

from webapp.helpers import api_publisher_session
from webapp.decorators import login_required
from webapp.publisher.cve.cve_helper import CveHelper

publisher_api = SnapPublisher(api_publisher_session)

@login_required
def get_cves(snap_name, revision):
 
    # add query param filters, pagination, sort
    cve = CveHelper()

    can_view_cves = cve.can_user_access_cve_data(snap_name=snap_name)
    if not can_view_cves:
        return flask.jsonify({"error": "User is not allowed to see snap's CVE data.".format(revision, snap_name)}), 403  

    cves = cve.get_cve_with_revision(snap_name, revision)
    # print(json.dumps({"cves": cves}, indent=4))

 
    return flask.jsonify({"success": True, "data": cves})