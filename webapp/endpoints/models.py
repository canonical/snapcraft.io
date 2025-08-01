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

models = flask.Blueprint(
    "models",
    __name__,
)


@models.route("/api/store/<store_id>/models")
@login_required
@exchange_required
def get_models(store_id):
    """
    Retrieves models associated with a given store ID.

    Args:
        store_id (int): The ID of the store for which to retrieve models.

    Returns:
        dict: A dictionary containing the response message, success status,
        and data.
    """
    res = {}
    try:
        models = publisher_gateway.get_store_models(flask.session, store_id)
        res["success"] = True
        res["data"] = models
        response = make_response(res, 200)
        response.cache_control.max_age = "3600"
    except StoreApiResponseErrorList as error_list:
        error_messages = [
            f"{error.get('message', 'An error occurred')}"
            for error in error_list.errors
        ]
        if "unauthorized" in error_messages:
            res["message"] = "Store not found"
        else:
            res["message"] = " ".join(error_messages)
        res["success"] = False
        response = make_response(res, 500)

    return response


@models.route("/api/store/<store_id>/models/<model_name>/policies")
@login_required
@exchange_required
def get_policies(store_id: str, model_name: str):
    """
    Get the policies for a given store model.

    Args:
        store_id (str): The ID of the store.
        model_name (str): The name of the model.

    Returns:
        dict: A dictionary containing the response message and success
    """
    brand_id = get_brand_id(flask.session, store_id)
    res = {}

    try:
        policies = publisher_gateway.get_store_model_policies(
            flask.session, brand_id, model_name
        )
        res["success"] = True
        res["data"] = policies
        response = make_response(res, 200)
        response.cache_control.max_age = "3600"
        return response
    except StoreApiResponseErrorList as error_list:
        res["success"] = False
        res["message"] = " ".join(
            [
                f"{error.get('message', 'An error occurred')}"
                for error in error_list.errors
            ]
        )
    except Exception:
        res["success"] = False
        res["message"] = "An error occurred"

    return make_response(res, 500)
