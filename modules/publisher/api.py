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

SCREENSHOTS_QUERY_URL = ''.join([
    DASHBOARD_API,
    'snaps/{snap_id}/binary-metadata'
])

SNAP_INFO_URL = ''.join([
    DASHBOARD_API,
    'snaps/info/{snap_name}',
])


def get_authorization_header():
    authorization = authentication.get_authorization_header(
        flask.session['macaroon_root'],
        flask.session['macaroon_discharge']
    )

    return {
        'Authorization': authorization
    }


def verify_response(response, url, endpoint, login_endpoint):
    verified_response = authentication.verify_response(
        response,
        flask.session,
        url,
        endpoint,
        login_endpoint,
        '/account'
    )

    if verified_response is not None:
        if verified_response['redirect'] is None:
            return response.raise_for_status
        else:
            return flask.redirect(
                verified_response['redirect']
            )


def get_account():
    authorization = authentication.get_authorization_header(
        flask.session['macaroon_root'],
        flask.session['macaroon_discharge']
    )

    headers = {
        'X-Ubuntu-Series': '16',
        'X-Ubuntu-Architecture': 'amd64',
        'Authorization': authorization
    }

    response = cache.get(
        url=ACCOUNT_URL,
        method='GET',
        headers=headers
    )

    verified_response = verify_response(
        response,
        ACCOUNT_URL,
        '/account',
        '/login'
    )

    if verified_response is not None:
        return {
            'redirect': verified_response
        }

    return response.json()


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


def get_snap_info(snap_name):
    response = cache.get(
        SNAP_INFO_URL.format(snap_name=snap_name),
        headers=get_authorization_header()
    )

    if response.status_code == 404:
        message = 'Snap not found: {snap_name}'.format(**locals())
        flask.abort(404, message)

    return response.json()


def get_snap_id(snap_name):
    snap_info = get_snap_info(snap_name)

    return snap_info['snap_id']


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
