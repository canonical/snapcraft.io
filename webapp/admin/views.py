# Packages
import flask
from canonicalwebteam.store_api.stores.snapstore import SnapPublisher
from canonicalwebteam.store_api.exceptions import (
    StoreApiError,
    StoreApiResponseErrorList,
)

# Local
from webapp.helpers import api_publisher_session
from webapp.api.exceptions import ApiError
from webapp.decorators import login_required
from webapp.publisher.views import _handle_error, _handle_error_list
from webapp.admin import logic

publisher_api = SnapPublisher(api_publisher_session)

admin = flask.Blueprint(
    "admin", __name__, template_folder="/templates", static_folder="/static"
)


@admin.route("/admin")
@login_required
def get_stores():
    try:
        account_info = publisher_api.get_account(flask.session)
    except StoreApiResponseErrorList as api_response_error_list:
        return _handle_error_list(api_response_error_list.errors)
    except (StoreApiError, ApiError) as api_error:
        return _handle_error(api_error)

    stores = logic.get_admin_stores(account_info)

    if not stores:
        flask.abort(403)

    return flask.render_template(
        "admin/admin.html", stores=stores, store_id=stores[0]["id"]
    )


@admin.route("/admin/<store_id>/snaps")
@login_required
def get_store(store_id):

    return flask.render_template("admin/admin.html", store_id=store_id)
