import os
from webapp import api
from webapp.api.exceptions import ApiResponseError, ApiResponseDecodeError

api_session = api.requests.Session(timeout=(.5, 6))

SPREADSHEET_REPORT_SNAP = os.getenv(
    "SPREADSHEET_REPORT_SNAP", "https://url.to.spreadsheet/"
)


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


def post_report_snap(json):
    if not SPREADSHEET_REPORT_SNAP:
        raise ApiResponseError("Spreadsheet url not specified", 500)

    response = api_session.post(url=SPREADSHEET_REPORT_SNAP, data=json)

    return process_response(response)
