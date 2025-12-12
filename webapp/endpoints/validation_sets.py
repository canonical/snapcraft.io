import flask

from canonicalwebteam.exceptions import StoreApiError
from canonicalwebteam.store_api.dashboard import Dashboard

from webapp.decorators import login_required
from webapp.helpers import api_session

dashboard = Dashboard(api_session)

validation_sets = flask.Blueprint(
    "validation-sets",
    __name__,
)


def format_validation_set(validation_set):
    return validation_set["headers"]


@validation_sets.route("/api/validation-sets")
@login_required
def get_validation_sets():
    res = {}

    try:
        validation_sets_data = dashboard.get_validation_sets(flask.session)
        res["success"] = True

        if len(validation_sets_data["assertions"]) > 0:
            res["data"] = [
                format_validation_set(item)
                for item in validation_sets_data["assertions"]
            ]
        else:
            res["data"] = []

        response = flask.make_response(res, 200)
        response.cache_control.max_age = "3600"
    except StoreApiError as error_list:
        error_messages = [
            f"{error.get('message', 'An error occurred')}"
            for error in error_list.errors
        ]

        res["message"] = " ".join(error_messages)
        res["success"] = False
        response = flask.make_response(res, 500)

    return response


@validation_sets.route("/api/validation-sets/<validation_set_id>")
@login_required
def get_validation_set(validation_set_id):
    res = {}

    try:
        validation_set = dashboard.get_validation_set(
            flask.session, validation_set_id
        )
        res["success"] = True

        if len(validation_set["assertions"]) > 0:
            res["data"] = [
                format_validation_set(item)
                for item in validation_set["assertions"]
            ]
        else:
            res["data"] = []

        response = flask.make_response(res, 200)
        response.cache_control.max_age = "3600"
    except StoreApiError as error_list:
        error_messages = [
            f"{error.get('message', 'An error occurred')}"
            for error in error_list.errors
        ]

        res["message"] = " ".join(error_messages)
        res["success"] = False
        response = flask.make_response(res, 500)

    return response
