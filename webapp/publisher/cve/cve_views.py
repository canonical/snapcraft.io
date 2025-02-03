# Standard library
import json
import os

# Packages
import flask
from canonicalwebteam.store_api.stores.snapstore import SnapPublisher
from canonicalwebteam.store_api.exceptions import (
    StoreApiResponseErrorList,
)

# Local
from webapp.helpers import api_publisher_session, launchpad
from webapp.decorators import login_required
from webapp.publisher.snaps import logic
from webapp.api.github import GitHub
from webapp.publisher.cve.cve import Cve

publisher_api = SnapPublisher(api_publisher_session)

@login_required
def get_cves(snap_name, revision):
    snap_details = publisher_api.get_snap_info(snap_name, flask.session)
    # print(json.dumps(snap_details, indent=4))
    snap_store = snap_details['store']
    publisher = snap_details['publisher']

    # add permission check
    #     return flask.jsonify({"error": "Revision {} for '{}' does not exist.".format(revision, snap_name)}), 404  

    cve = Cve()
    cves = cve.get_cve_with_revision(snap_name, revision)
    print(json.dumps({"cves": cves}, indent=4))

 
    return flask.jsonify({"success": True, "data": cves})