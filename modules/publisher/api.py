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

AGREEMENT_URL = ''.join([
    DASHBOARD_API,
    'agreement/'
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


def get_authorization_header(session):
    authorization = authentication.get_authorization_header(
        session['macaroon_root'],
        session['macaroon_discharge']
    )

    return {
        'Authorization': authorization
    }


def verify_response(response, session, url, endpoint, login_endpoint):
    verified_response = authentication.verify_response(
        response,
        session,
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


def get_account(session):
    authorization = authentication.get_authorization_header(
        session['macaroon_root'],
        session['macaroon_discharge']
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
        session,
        ACCOUNT_URL,
        '/account',
        '/login',
    )

    if verified_response is not None:
        return {
            'redirect': verified_response
        }

    return response.json()


def get_agreement(session):
    headers = get_authorization_header(session)

    agreement_response = cache.get(
        AGREEMENT_URL,
        headers
    )

    return agreement_response.json()


def post_agreement(session, agreed):
    headers = get_authorization_header(session)

    json = {
        'latest_tos_accepted': agreed
    }
    agreement_response = cache.get(
        AGREEMENT_URL,
        headers,
        json
    )

    return agreement_response.json()


def post_username(session, username):
    headers = get_authorization_header(session)
    json = {
        'short_namespace': username
    }
    username_response = cache.get(
        url=ACCOUNT_URL,
        headers=headers,
        json=json,
        method='PATCH'
    )

    if username_response.status_code == 204:
        return {}
    else:
        return username_response.json()


def get_publisher_metrics(session, json):
    authed_metrics_headers = PUB_METRICS_QUERY_HEADERS.copy()
    auth_header = get_authorization_header(session)['Authorization']
    authed_metrics_headers['Authorization'] = auth_header

    metrics_response = cache.get(
        SNAP_PUB_METRICS_URL,
        headers=authed_metrics_headers,
        json=json
    )

    return metrics_response.json()


def get_snap_info(snap_name, session):
    response = cache.get(
        SNAP_INFO_URL.format(snap_name=snap_name),
        headers=get_authorization_header(session)
    )

    if response.status_code == 404:
        message = 'Snap not found: {snap_name}'.format(**locals())
        flask.abort(404, message)

    return response.json()


def get_snap_id(snap_name, session):
    snap_info = get_snap_info(snap_name, session)

    return snap_info['snap_id']


def snap_metadata(snap_id, session, json=None):
    method = "PUT" if json is not None else None

    metadata_response = cache.get(
        METADATA_QUERY_URL.format(snap_id=snap_id),
        headers=get_authorization_header(session),
        json=json,
        method=method
    )

    return metadata_response.json()


def get_snap_status(snap_id, session):
    status_response = cache.get(
        STATUS_QUERY_URL.format(snap_id=snap_id),
        headers=get_authorization_header(session)
    )

    return status_response.json()


def snap_screenshots(snap_id, session, data=None, files=None):
    method = None
    files_array = None
    headers = get_authorization_header(session)
    headers['Accept'] = 'application/json'

    if data:
        method = 'PUT'

        files_array = []
        if files:
            for f in files:
                files_array.append(
                    (f.filename, (f.filename, f.stream, f.mimetype))
                )
        else:
            # API requires a multipart request, but we have no files to push
            # https://github.com/requests/requests/issues/1081
            files_array = {'info': ('', data['info'])}
            data = None

    screenshot_response = cache.get(
        SCREENSHOTS_QUERY_URL.format(snap_id=snap_id),
        headers=headers,
        data=data,
        method=method,
        files=files_array
    )

    return screenshot_response.json()
