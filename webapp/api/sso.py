import os
from webapp import api
from webapp.api.exceptions import ApiResponseError, ApiResponseDecodeError

api_session = api.requests.Session()

SNAPSTORE_DASHBOARD_API_URL = os.getenv(
    "SNAPSTORE_DASHBOARD_API_URL", "https://dashboard.snapcraft.io/"
)

LOGIN_URL = os.getenv("LOGIN_URL", "https://login.ubuntu.com")


HEADERS = {
    "Accept": "application/json, application/hal+json",
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
}


def process_response(response):
    if not response.ok:
        raise ApiResponseError("Unknown error from api", response.status_code)

    try:
        body = response.json()
    except ValueError as decode_error:
        api_error_exception = ApiResponseDecodeError(
            "JSON decoding failed: {}".format(decode_error)
        )
        raise api_error_exception

    return body


def post_macaroon(json):
    url = "".join([SNAPSTORE_DASHBOARD_API_URL, "dev/api/acl/"])
    response = api_session.post(url=url, headers=HEADERS, json=json)

    return process_response(response)


def get_refreshed_discharge(json):
    url = "".join([LOGIN_URL, "/api/v2/tokens/refresh"])
    response = api_session.post(url=url, headers=HEADERS, json=json)

    return process_response(response)
