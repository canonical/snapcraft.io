import talisker
from webapp.decorators import login_required
import flask
from flask import (
    Blueprint,
    request,
    make_response,
)

from webapp.packages.logic import (
    get_packages,
    get_package,
    get_snaps_account_info,
)
from webapp.config import APP_NAME

from canonicalwebteam.store_api.stores.snapstore import (
    SnapStore,
    SnapPublisher,
)

FIELDS = [
    "title",
    "summary",
    "media",
    "publisher",
    "categories",
]

store_packages = Blueprint(
    "package",
    __name__,
)
#    "store": SnapStore,
#         "publisher": SnapPublisher,
#         "fields": [
#             "title",
#             "summary",
#             "media",
#             "publisher",
#             "categories",
#         ],
#         "permissions": [
#             "edit_account",
#             "package_access",
#             "package_metrics",
#             "package_register",
#             "package_release",
#             "package_update",
#             "package_upload_request",
#             "store_admin",
#         ],
#         "size": 15,


@store_packages.route("/store.json")
def get_store_packages():
    args = dict(request.args)
    libraries = bool(args.pop("fields", ""))

    res = make_response(
        get_packages(
            SnapStore, SnapPublisher, APP_NAME, libraries, FIELDS, 15, args
        )
    )
    return res


@store_packages.route("/<any(snaps):package_type>")
@login_required
def package(package_type):
    """
    Retrieves and returns package information based on the current app
    and package type.

    :returns: Response: The HTTP response containing the JSON data of the
    packages.
    """

    publisher_api = SnapPublisher(talisker.requests.get_session())

    account_info = publisher_api.get_account(flask.session)

    user_snaps, registered_snaps = get_snaps_account_info(account_info)
    flask_user = flask.session["publisher"]

    response = make_response(
        {
            "snaps": user_snaps,
            "current_user": flask_user["nickname"],
            "registered_snaps": registered_snaps,
        }
    )

    return response


@store_packages.route("/<package_name>/card.json")
def get_store_package(package_name):

    has_libraries = bool(request.args.get("fields", ""))
    res = make_response(
        get_package(
            SnapStore,
            SnapPublisher,
            APP_NAME,
            package_name,
            FIELDS,
            has_libraries,
        )
    )
    return res
