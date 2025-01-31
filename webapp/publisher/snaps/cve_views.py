# Standard library
import json

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

publisher_api = SnapPublisher(api_publisher_session)


@login_required
def get_cves(snap_name, revision):
    snap_details = publisher_api.get_snap_info(snap_name, flask.session)
    # print(json.dumps(snap_details, indent=4))
    snap_store = snap_details['store']
    publisher = snap_details['publisher']

    print(revision)

    
    return flask.jsonify({"success": True, "data": "yas"})