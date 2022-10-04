# Packages
import flask
from flask import json
from canonicalwebteam.store_api.stores.snapstore import (
    SnapPublisher,
    SnapStore,
)
from canonicalwebteam.store_api.exceptions import (
    StoreApiError,
    StoreApiResponseErrorList,
)

# Local
from webapp.helpers import api_publisher_session
from webapp.api.exceptions import ApiError
from webapp.decorators import login_required
from webapp.publisher.views import _handle_error, _handle_error_list

store_api = SnapStore(api_publisher_session)
publisher_api = SnapPublisher(api_publisher_session)


@login_required
def get_collaboration_snap(snap_name):
    try:
        snap_details = publisher_api.get_snap_info(snap_name, flask.session)
    except StoreApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except (StoreApiError, ApiError) as api_error:
        return _handle_error(api_error)

    context = {
        "snap_id": snap_details["snap_id"],
        "snap_name": snap_details["snap_name"],
        "snap_title": snap_details["title"],
        "publisher_name": snap_details["publisher"]["display-name"],
        "collaborators": [],
    }

    return flask.render_template(
        "publisher/collaboration.html",
        **context,
        collaborations_data=json.dumps(context)
    )
