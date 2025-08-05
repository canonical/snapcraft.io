# Packages
import flask
from flask import make_response
from canonicalwebteam.exceptions import (
    StoreApiResponseErrorList,
    StoreApiResourceNotFound,
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


@models.route(
    "/api/store/<store_id>/models/<model_name>/policies", methods=["POST"]
)
@login_required
@exchange_required
def create_policy(store_id: str, model_name: str):
    """
    Creat policy for a store model.

    Args:
        store_id (str): The ID of the store.
        model_name (str): The name of the model.

    Returns:
        dict: A dictionary containing the response message and success
    """
    signing_key = flask.request.form.get("signing_key")
    res = {}
    try:
        signing_keys_data = publisher_gateway.get_store_signing_keys(
            flask.session, store_id
        )
        signing_keys = [key["sha3-384"] for key in signing_keys_data]

        if not signing_key:
            res["message"] = "Signing key required"
            res["success"] = False
            return make_response(res, 500)

        if signing_key in signing_keys:
            publisher_gateway.create_store_model_policy(
                flask.session, store_id, model_name, signing_key
            )
            res["success"] = True
        else:
            res["message"] = "Invalid signing key"
            res["success"] = False
    except StoreApiResponseErrorList as error_list:
        res["success"] = False
        res["message"] = error_list.errors[0]["message"]

    if res["success"]:
        return make_response(res, 200)
    return make_response(res, 500)


@models.route(
    "/api/store/<store_id>/models/<model_name>/policies/<revision>",
    methods=["DELETE"],
)
@login_required
@exchange_required
def delete_policy(store_id: str, model_name: str, revision: str):
    res = {}
    try:
        response = publisher_gateway.delete_store_model_policy(
            flask.session, store_id, model_name, revision
        )
        if response.status_code == 204:
            res = {"success": True}
            return make_response(res, 200)
        elif response.status_code == 404:
            res = {"success": False, "message": "Policy not found"}
            return make_response(res, 404)
    except StoreApiResponseErrorList as error_list:
        res["success"] = False
        res["message"] = error_list.errors[0]["message"]
        return make_response(res, 500)


@models.route("/api/store/<store_id>/models/<model_name>", methods=["PATCH"])
@login_required
@exchange_required
def update_model(store_id: str, model_name: str):
    """
    Update a model for a given store.

    Args:
        store_id (str): The ID of the store.
        model_name (str): The name of the model.

    Returns:
        dict: A dictionary containing the response message and success
            status.
    """
    res = {}

    try:
        api_key = flask.request.form.get("api_key", "")

        if len(api_key) != 50 and not api_key.isalpha():
            res["message"] = "Invalid API key"
            res["success"] = False
            return make_response(res, 500)

        publisher_gateway.update_store_model(
            flask.session, store_id, model_name, api_key
        )
        res["success"] = True

    except StoreApiResponseErrorList as error_list:
        res["success"] = False
        res["message"] = error_list.errors[0]["message"]

    except StoreApiResourceNotFound:
        res["success"] = False
        res["message"] = "Model not found"
    if res["success"]:
        return make_response(res, 200)
    return make_response(res, 500)
