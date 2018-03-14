import modules.cache as cache
import os
from modules.exceptions import (
    InvalidResponseContent,
    ApiErrorResponse
)

SNAPCRAFT_IO_API = os.getenv(
    'SNAPCRAFT_IO_API',
    'https://api.snapcraft.io/api/v1/',
)

SNAP_DETAILS_URL = ''.join([
    SNAPCRAFT_IO_API,
    'snaps/details/{snap_name}',
    '?channel=stable',
])
DETAILS_QUERY_HEADERS = {
    'X-Ubuntu-Series': '16',
    'X-Ubuntu-Architecture': 'amd64',
}

SNAP_METRICS_URL = ''.join([
    SNAPCRAFT_IO_API,
    'snaps/metrics',
])
METRICS_QUERY_HEADERS = {
    'Content-Type': 'application/json'
}

SNAP_SEARCH_URL = ''.join([
    SNAPCRAFT_IO_API,
    'snaps/search',
    '?q={snap_name}&page={page}&size={size}',
    '&confinement=strict,classic',
])
SEARCH_QUERY_HEADERS = {
    'X-Ubuntu-Frameworks': '*',
    'X-Ubuntu-Architecture': 'amd64',
    'Accept': 'application/hal+json'
}

FEATURE_SNAPS_URL = ''.join([
    SNAPCRAFT_IO_API,
    'snaps/search',
    '?confinement=strict,classic&q=&section=featured',
])

PROMOTED_QUERY_URL = ''.join([
    SNAPCRAFT_IO_API,
    'snaps/search',
    '?promoted=true',
    '&confinement=strict,classic',
])
PROMOTED_QUERY_HEADERS = {
    'X-Ubuntu-Series': '16'
}


def process_response(response):
    try:
        body = response.json()
    except ValueError as decode_error:
        error_message = 'JSON decoding failed: {}'.format(decode_error)
        raise InvalidResponseContent(error_message)

    if not response.ok:
        if 'error_list' in body:
            api_error_exception = ApiErrorResponse("Error list")
            api_error_exception.status_code = response.status_code
            errors = []
            for error in body['error_list']:
                errors.append(error['message'])
            api_error_exception.errors = errors

            raise api_error_exception
        else:
            api_error_exception = ApiErrorResponse("Unknown error")
            api_error_exception.status_code = response.status_code
            raise api_error_exception

    return body


def get_featured_snaps():
    featured_response = cache.get(
        FEATURE_SNAPS_URL,
        headers=SEARCH_QUERY_HEADERS
    )

    return process_response(featured_response)


def get_promoted_snaps():
    promoted_response = cache.get(
        PROMOTED_QUERY_URL,
        headers=PROMOTED_QUERY_HEADERS
    )

    return process_response(promoted_response)


def get_searched_snaps(snap_searched, size, page):
    searched_response = cache.get(
        SNAP_SEARCH_URL.format(
            snap_name=snap_searched,
            size=size,
            page=page
        ),
        headers=SEARCH_QUERY_HEADERS
    )

    return process_response(searched_response)


def get_snap_details(snap_name):
    details_response = cache.get(
        SNAP_DETAILS_URL.format(snap_name=snap_name),
        headers=DETAILS_QUERY_HEADERS
    )

    return process_response(details_response)


def get_public_metrics(snap_name, json):
    metrics_response = cache.get(
        SNAP_METRICS_URL.format(snap_name=snap_name),
        headers=METRICS_QUERY_HEADERS,
        json=json
    )

    return process_response(metrics_response)
