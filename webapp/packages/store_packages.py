from talisker import requests

from canonicalwebteam.store_api.dashboard import Dashboard

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
from webapp.helpers import api_session


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

dashboard = Dashboard(api_session)

@store_packages.route("/store.json")
def get_store_packages():
    args = dict(request.args)
    libraries = bool(args.pop("fields", ""))

    res = make_response(
        get_packages(
            FIELDS, 15, args
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

    account_info = dashboard.get_account(flask.session)

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
            package_name,
            FIELDS,
            has_libraries,
        )
    )
    return res
