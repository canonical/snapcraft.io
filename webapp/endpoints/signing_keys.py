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
from webapp.endpoints.models import get_models, get_policies


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


@signing_keys.route("/api/store/<store_id>/signing-keys", methods=["POST"])
@login_required
@exchange_required
def create_signing_key(store_id: str):
    name = flask.request.form.get("name")
    res = {}

    try:
        if name and len(name) <= 128:
            publisher_gateway.create_store_signing_key(
                flask.session, store_id, name
            )
            res["success"] = True
            return make_response(res, 200)
        else:
            res["message"] = "Invalid signing key. Limit 128 characters"
            res["success"] = False
            make_response(res, 500)
    except StoreApiResponseErrorList as error_list:
        res["success"] = False
        res["message"] = error_list.errors[0]["message"]

    return make_response(res, 500)


@signing_keys.route(
    "/api/store/<store_id>/signing-keys/<signing_key_sha3_384>",
    methods=["DELETE"],
)
@login_required
@exchange_required
def delete_signing_key(store_id: str, signing_key_sha3_384: str):
    """
    Deletes a signing key from the store.

    Args:
        store_id (str): The ID of the store.
        signing_key_sha3_384 (str): The signing key to delete.

    Returns:
        Response: A response object with the following fields:
            - success (bool): True if the signing key was deleted successfully,
              False otherwise.
            - message (str): A message describing the result of the deletion.
            - data (dict): A dictionary containing models where the signing
              key is used.
    """
    res = {}

    try:
        response = publisher_gateway.delete_store_signing_key(
            flask.session, store_id, signing_key_sha3_384
        )

        if response.status_code == 204:
            res["success"] = True
            return make_response(res, 200)
        elif response.status_code == 404:
            res["success"] = False
            res["message"] = "Signing key not found"
            return make_response(res, 404)
    except StoreApiResponseErrorList as error_list:
        message = error_list.errors[0]["message"]
        if (
            error_list.status_code == 409
            and "used to sign at least one serial policy" in message
        ):
            matching_models = []
            models_response = get_models(store_id).json
            models = models_response.get("data", [])

            for model in models:
                policies_resp = get_policies(store_id, model["name"]).json
                policies = policies_resp.get("data", [])
                matching_policies = [
                    {"revision": policy["revision"]}
                    for policy in policies
                    if policy["signing-key-sha3-384"] == signing_key_sha3_384
                ]
                if matching_policies:
                    matching_models.append(
                        {
                            "name": model["name"],
                            "policies": matching_policies,
                        }
                    )
                res["data"] = {"models": matching_models}
                res["message"] = "Signing key is used in at least one policy"
                res["success"] = False
        else:
            res["success"] = False
            res["message"] = error_list.errors[0]["message"]

        return make_response(res, 500)
