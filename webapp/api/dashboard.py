import os

from webapp import authentication
from webapp.api import requests
from webapp.api.exceptions import (
    AgreementNotSigned,
    ApiResponseDecodeError,
    ApiResponseError,
    ApiResponseErrorList,
    MacaroonRefreshRequired,
    MissingUsername
)


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

SCREENSHOTS_QUERY_URL = ''.join([
    DASHBOARD_API,
    'snaps/{snap_id}/binary-metadata'
])

SNAP_INFO_URL = ''.join([
    DASHBOARD_API,
    'snaps/info/{snap_name}',
])

REGISTER_NAME_URL = ''.join([
    DASHBOARD_API,
    'register-name/'
])

REVISION_HISTORY_URL = ''.join([
    DASHBOARD_API,
    'snaps/{snap_id}/history'
])


def process_response(response):
    try:
        body = response.json()
    except ValueError as decode_error:
        api_error_exception = ApiResponseDecodeError(
            'JSON decoding failed: {}'.format(decode_error),
        )
        raise api_error_exception

    if not response.ok:
        if 'error_list' in body:
            for error in body['error_list']:
                if error['code'] == 'user-not-ready':
                    if 'has not signed agreement' in error['message']:
                        raise AgreementNotSigned
                    elif 'missing namespace' in error['message']:
                        raise MissingUsername

            raise ApiResponseErrorList(
                'The api returned a list of errors',
                response.status_code,
                body['error_list']
            )
        else:
            raise ApiResponseError(
                'Unknown error from api',
                response.status_code
            )

    return body


def get_authorization_header(session):
    authorization = authentication.get_authorization_header(
        session['macaroon_root'],
        session['macaroon_discharge']
    )

    return {
        'Authorization': authorization
    }


def get_account(session):
    headers = get_authorization_header(session)

    response = requests.get(
        url=ACCOUNT_URL,
        method='GET',
        headers=headers
    )

    if authentication.is_macaroon_expired(response.headers):
        raise MacaroonRefreshRequired

    return process_response(response)


def get_agreement(session):
    headers = get_authorization_header(session)

    agreement_response = requests.get(
        AGREEMENT_URL,
        headers
    )

    if authentication.is_macaroon_expired(agreement_response.headers):
        raise MacaroonRefreshRequired

    return agreement_response.json()


def post_agreement(session, agreed):
    headers = get_authorization_header(session)

    json = {
        'latest_tos_accepted': agreed
    }
    agreement_response = requests.get(
        AGREEMENT_URL,
        headers,
        json
    )

    if authentication.is_macaroon_expired(agreement_response.headers):
        raise MacaroonRefreshRequired

    return process_response(agreement_response)


def post_username(session, username):
    headers = get_authorization_header(session)
    json = {
        'short_namespace': username
    }
    username_response = requests.get(
        url=ACCOUNT_URL,
        headers=headers,
        json=json,
        method='PATCH'
    )

    if authentication.is_macaroon_expired(username_response.headers):
        raise MacaroonRefreshRequired

    if username_response.status_code == 204:
        return {}
    else:
        return process_response(username_response)


def get_publisher_metrics(session, json):
    authed_metrics_headers = PUB_METRICS_QUERY_HEADERS.copy()
    auth_header = get_authorization_header(session)['Authorization']
    authed_metrics_headers['Authorization'] = auth_header

    metrics_response = requests.get(
        SNAP_PUB_METRICS_URL,
        headers=authed_metrics_headers,
        json=json
    )

    if authentication.is_macaroon_expired(metrics_response.headers):
        raise MacaroonRefreshRequired

    return process_response(metrics_response)


def post_register_name(
        session, snap_name,
        registrant_comment=None, is_private=False, store=None):

    json = {
        'snap_name': snap_name,
    }

    if registrant_comment:
        json['registrant_comment'] = registrant_comment

    if is_private:
        json['is_private'] = is_private

    if store:
        json['store'] = store

    response = requests.get(
        REGISTER_NAME_URL,
        headers=get_authorization_header(session),
        json=json,
        method='POST')

    if authentication.is_macaroon_expired(response.headers):
        raise MacaroonRefreshRequired

    return process_response(response)


def get_snap_info(snap_name, session):
    response = requests.get(
        SNAP_INFO_URL.format(snap_name=snap_name),
        headers=get_authorization_header(session)
    )

    if authentication.is_macaroon_expired(response.headers):
        raise MacaroonRefreshRequired

    return process_response(response)


def get_snap_id(snap_name, session):
    snap_info = get_snap_info(snap_name, session)

    return snap_info['snap_id']


def snap_metadata(snap_id, session, json=None):
    method = "PUT" if json is not None else None

    metadata_response = requests.get(
        METADATA_QUERY_URL.format(snap_id=snap_id),
        headers=get_authorization_header(session),
        json=json,
        method=method
    )

    if authentication.is_macaroon_expired(metadata_response.headers):
        raise MacaroonRefreshRequired

    return process_response(metadata_response)


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

    screenshot_response = requests.get(
        SCREENSHOTS_QUERY_URL.format(snap_id=snap_id),
        headers=headers,
        data=data,
        method=method,
        files=files_array
    )

    if authentication.is_macaroon_expired(screenshot_response.headers):
        raise MacaroonRefreshRequired

    return process_response(screenshot_response)


def snap_revision_history(session, snap_id):
    response = requests.get(
        REVISION_HISTORY_URL.format(snap_id=snap_id),
        headers=get_authorization_header(session)
    )

    if authentication.is_macaroon_expired(response.headers):
        raise MacaroonRefreshRequired

    return process_response(response)
