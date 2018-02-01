import flask
import modules.authentication as authentication
import modules.cache as cache
import os


DASHBOARD_API = os.getenv(
    'DASHBOARD_API',
    'https://dashboard.snapcraft.io/dev/api/',
)

SNAP_PUB_METRICS_URL = ''.join([
    DASHBOARD_API,
    'snaps/metrics',
])
PUB_METRICS_QUERY_HEADERS = {
    'Content-Type': 'application/json'
}

ACCOUNT_URL = ''.join([
    DASHBOARD_API,
    'account',
])

METADATA_QUERY_URL = ''.join([
    DASHBOARD_API,
    'snaps/{snap_id}/metadata',
])

STATUS_QUERY_URL = ''.join([
    DASHBOARD_API,
    'snaps/{snap_id}/status',
])

SCREENSHOTS_QUERY_URL = (
    DASHBOARD_API,
    "/snaps/{snap_id}/binary-metadata"
)


def get_authorization_header():
    authorization = authentication.get_authorization_header(
        flask.session['macaroon_root'],
        flask.session['macaroon_discharge']
    )

    return {
        'Authorization': authorization
    }


def get_publisher_metrics(json):
    authed_metrics_headers = PUB_METRICS_QUERY_HEADERS.copy()
    auth_header = get_authorization_header()['Authorization']
    authed_metrics_headers['Authorization'] = auth_header

    metrics_response = cache.get(
        SNAP_PUB_METRICS_URL,
        headers=authed_metrics_headers,
        json=json
    )

    return metrics_response.json()


def snap_metadata(snap_id, json=None):
    method = "PUT" if json is not None else None

    metadata_response = cache.get(
        METADATA_QUERY_URL.format(snap_id=snap_id),
        headers=get_authorization_header(),
        json=json,
        method=method
    )

    return metadata_response.json()


def get_snap_status(snap_id):
    status_response = cache.get(
        STATUS_QUERY_URL.format(snap_id=snap_id),
        headers=get_authorization_header()
    )

    return status_response.json()


def snap_screenshots(snap_id, data=None, files=None):
    method = None
    files_array = None
    headers = get_authorization_header()
    headers['Accept'] = 'application/json'

    if data is not None:
        method = 'PUT'
        files_array = []
        if files is not None:
            for f in files:
                files_array.append(
                    (f.filename, (f.filename, f.stream, f.mimetype))
                )

    screenshot_response = cache.get(
        SCREENSHOTS_QUERY_URL.format(snap_id=snap_id),
        headers=headers,
        data=data,
        method=method,
        files=files_array
    )

    return screenshot_response.json()
