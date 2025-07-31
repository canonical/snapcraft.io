# Packages
import flask
from flask import make_response
from canonicalwebteam.exceptions import (
    StoreApiResponseErrorList,
)
from canonicalwebteam.store_api.publishergw import PublisherGW

# Local
from webapp.decorators import login_required, exchange_required
from webapp.helpers import api_publisher_session, get_brand_id


publisher_gateway = PublisherGW("snap", api_publisher_session)

signing_keys = flask.Blueprint(
    "signing_keys",
    __name__,
)


@signing_keys.route("/api/store/<store_id>/signing-keys")
@login_required
@exchange_required
def get_signing_keys(store_id: str):
    brand_id = get_brand_id(flask.session, store_id)
    res = {}
    try:
        signing_keys = publisher_gateway.get_store_signing_keys(
            flask.session, brand_id
        )
        res["data"] = signing_keys
        res["success"] = True
        response = make_response(res, 200)
        response.cache_control.max_age = 3600
        return response
    except StoreApiResponseErrorList as error_list:
        res["success"] = False
        res["success"] = False
        res["message"] = " ".join(
            [
                f"{error.get('message', 'An error occurred')}"
                for error in error_list.errors
            ]
        )
        res["data"] = []
        return make_response(res, 500)
