import flask
import modules.cache as cache
import os

SNAPCRAFT_IO_API = os.getenv(
    'SNAPCRAFT_IO_API',
    'https://api.snapcraft.io/api/v1/',
)
SEARCH_API = os.getenv(
    'SEARCH_API',
    'https://search.apps.ubuntu.com/api/v1/',
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
    SEARCH_API,
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


def normalize_searched_snaps(search_results):
    return (
        search_results['_embedded']['clickindex:package']
        if search_results['_embedded']
        else []
    )


def get_featured_snaps():
    featured_response = cache.get(
        FEATURE_SNAPS_URL,
        headers=SEARCH_QUERY_HEADERS
    )

    return normalize_searched_snaps(featured_response.json())


def get_promoted_snaps():
    promoted_response = cache.get(
        PROMOTED_QUERY_URL,
        headers=PROMOTED_QUERY_HEADERS
    )

    return normalize_searched_snaps(promoted_response.json())


def get_searched_snaps(snap_searched, size, page):
    searched_response = cache.get(
        SNAP_SEARCH_URL.format(
            snap_name=snap_searched,
            size=size,
            page=page
        ),
        headers=SEARCH_QUERY_HEADERS
    )

    return searched_response.json()


def get_snap_details(snap_name):
    details_response = cache.get(
        SNAP_DETAILS_URL.format(snap_name=snap_name),
        headers=DETAILS_QUERY_HEADERS
    )

    if details_response.status_code >= 400:
        message = (
            'Failed to get snap details for {snap_name}'.format(**locals())
        )

        if details_response.status_code == 404:
            message = 'Snap not found: {snap_name}'.format(**locals())

        flask.abort(details_response.status_code, message)

    return details_response.json()


def get_public_metrics(snap_name, json):
    metrics_response = cache.get(
        SNAP_METRICS_URL.format(snap_name=snap_name),
        headers=METRICS_QUERY_HEADERS,
        json=json
    )

    return metrics_response.json()


def get_snap_id(snap_name):
    snap_details = get_snap_details(snap_name)
    return snap_details['snap_id']
