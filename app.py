"""
A Flask application for snapcraft.io.

The web frontend for the snap store.
"""

import datetime
import flask
import hashlib
import humanize
import modules.cache as cache
import modules.authentication as authentication
import modules.public.views as public_views
import modules.public.api as public_api
import os
import socket
from dateutil import parser, relativedelta
from flask_openid import OpenID
from flask_wtf.csrf import CSRFProtect
from functools import wraps
from json import dumps
from modules.macaroon import MacaroonRequest, MacaroonResponse
from operator import itemgetter
from urllib.parse import unquote, urlparse, urlunparse
from werkzeug.contrib.fixers import ProxyFix


app = flask.Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app)
app.secret_key = os.environ['SECRET_KEY']
app.wtf_csrf_secret_key = os.environ['WTF_CSRF_SECRET_KEY']
app.url_map.strict_slashes = False

SNAPCRAFT_IO_API = os.getenv(
    'SNAPCRAFT_IO_API',
    'https://api.snapcraft.io/api/v1/',
)
DASHBOARD_API = os.getenv(
    'DASHBOARD_API',
    'https://dashboard.snapcraft.io/dev/api/',
)
SEARCH_API = os.getenv(
    'SEARCH_API',
    'https://search.apps.ubuntu.com/api/v1/',
)
LOGIN_URL = os.getenv(
    'LOGIN_URL',
    'https://login.ubuntu.com',
)

oid = OpenID(
    app=app,
    stateless=True,
    safe_roots=[],
    extension_responses=[MacaroonResponse]
)

csrf = CSRFProtect(app)


# Request only stable snaps
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

screenshots_query_url = (
    "https://dashboard.snapcraft.io/dev/api"
    "/snaps/{snap_id}/binary-metadata"
)


@app.before_request
def clear_trailing():
    """
    Remove trailing slashes from all routes
    We like our URLs without slashes
    """

    parsed_url = urlparse(unquote(flask.request.url))
    path = parsed_url.path

    if path != '/' and path.endswith('/'):
        new_uri = urlunparse(
            parsed_url._replace(path=path[:-1])
        )

        return flask.redirect(new_uri)


def get_authorization_header():
    authorization = authentication.get_authorization_header(
        flask.session['macaroon_root'],
        flask.session['macaroon_discharge']
    )

    return {
        'Authorization': authorization
    }


def _transform_api_data(details):
    details['filesize'] = humanize.naturalsize(details['binary_filesize'])
    details['last_updated'] = (
        humanize.naturaldate(
            parser.parse(details.get('last_updated'))
        )
    )

    return details


def build_image_info(image, image_type):
    """
    Build info json structure for image upload
    Return json oject with useful informations for the api
    """
    hasher = hashlib.sha256(image.read())
    hash_final = hasher.hexdigest()
    image.seek(0)

    return {
        "key": image.filename,
        "type": image_type,
        "filename": image.filename,
        "hash": hash_final
    }


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
        screenshots_query_url.format(snap_id=snap_id),
        headers=headers,
        data=data,
        method=method,
        files=files_array
    )

    return screenshot_response.json()


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


def login_required(func):
    @wraps(func)
    def is_user_logged_in(*args, **kwargs):
        if not authentication.is_authenticated(flask.session):
            return redirect_to_login()

        return func(*args, **kwargs)
    return is_user_logged_in


def redirect_to_login():
    return flask.redirect('login?next=' + flask.request.url_rule.rule)


def get_snap_id(snap_name):
    snap_details = public_api.get_snap_details(snap_name)
    return snap_details['snap_id']


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


# Error handlers
# ===
@app.errorhandler(404)
def page_not_found(error):
    """
    For 404 pages, display the 404.html template,
    passing through the error description.
    """

    return flask.render_template(
        '404.html', description=error.description
    ), 404


# Global tasks for all requests
# ===
@app.after_request
def apply_caching(response):
    response.headers["X-Commit-ID"] = os.getenv('COMMIT_ID')
    response.headers["X-Hostname"] = socket.gethostname()
    return response


# Redirects
# ===
@app.route('/docs', defaults={'path': ''})
@app.route('/docs/<path:path>')
def docs_redirect(path):
    return flask.redirect('https://docs.snapcraft.io/' + path)


@app.route('/community')
def community_redirect():
    return flask.redirect('/')


@app.route('/login', methods=['GET', 'POST'])
@oid.loginhandler
@csrf.exempt
def login():
    if authentication.is_authenticated(flask.session):
        return flask.redirect(oid.get_next_url())

    root = authentication.request_macaroon()
    openid_macaroon = MacaroonRequest(
        caveat_id=authentication.get_caveat_id(root)
    )
    flask.session['macaroon_root'] = root

    return oid.try_login(
        LOGIN_URL,
        ask_for=['email', 'nickname', 'image'],
        ask_for_optional=['fullname'],
        extensions=[openid_macaroon]
    )


@oid.after_login
def after_login(resp):
    flask.session['openid'] = {
        'identity_url': resp.identity_url,
        'nickname': resp.nickname,
        'fullname': resp.fullname,
        'image': resp.image,
        'email': resp.email
    }

    flask.session['macaroon_discharge'] = resp.extensions['macaroon'].discharge
    return flask.redirect('/account')


@app.route('/logout')
def logout():
    if authentication.is_authenticated(flask.session):
        authentication.empty_session(flask.session)
    return flask.redirect('/')


@app.route('/account')
@login_required
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

    verified_response = authentication.verify_response(
        response,
        flask.session,
        ACCOUNT_URL,
        '/account',
        '/login'
    )

    if verified_response is not None:
        if verified_response['redirect'] is None:
            return response.raise_for_status
        else:
            return flask.redirect(
                verified_response['redirect']
            )

    print('HTTP/1.1 {} {}'.format(response.status_code, response.reason))

    user_snaps = response.json()
    return flask.render_template(
        'account.html',
        namespace=user_snaps['namespace'],
        user_snaps=user_snaps['snaps']['16'],
        user=flask.session['openid']
    )


@app.route('/create')
def create_redirect():
    return flask.redirect('https://docs.snapcraft.io/build-snaps')


# Normal views
# ===
@app.route('/')
def homepage():
    return public_views.homepage()


@app.route('/store')
def store():
    return public_views.store()


@app.route('/discover')
def discover():
    return flask.redirect('/store')


@app.route('/snaps')
def snaps():
    return public_views.snaps()


@app.route('/search')
def search_snap():
    return public_views.search_snap()


@app.route('/<snap_name>')
def snap_details(snap_name):
    return public_views.snap_details(snap_name)


# Publisher views
# ===
@app.route('/account/snaps/<snap_name>/measure')
@login_required
def publisher_snap_measure(snap_name):
    """
    A view to display the snap measure page for specific snaps.

    This queries the snapcraft API (api.snapcraft.io) and passes
    some of the data through to the publisher/measure.html template,
    with appropriate sanitation.
    """
    metric_period = flask.request.args.get('period', default='30d', type=str)
    metric_bucket = ''.join([i for i in metric_period if not i.isdigit()])
    metric_period_int = int(metric_period[:-1])

    installed_base_metric = flask.request.args.get(
        'active-devices',
        default='version',
        type=str
    )

    details = public_api.get_snap_details(snap_name)

    today = datetime.datetime.utcnow().date()
    end = today - relativedelta.relativedelta(days=1)
    start = None
    if metric_bucket == 'd':
        start = end - relativedelta.relativedelta(days=metric_period_int)
    elif metric_bucket == 'm':
        start = end - relativedelta.relativedelta(months=metric_period_int)
    elif metric_bucket == 'y':
        start = end - relativedelta.relativedelta(years=metric_period_int)

    if installed_base_metric == 'version':
        installed_base = "weekly_installed_base_by_version"
    elif installed_base_metric == 'os':
        installed_base = "weekly_installed_base_by_operating_system"
    metrics_query_json = {
        "filters": [
            {
                "metric_name": installed_base,
                "snap_id": details['snap_id'],
                "start": start.strftime('%Y-%m-%d'),
                "end": end.strftime('%Y-%m-%d')
            },
            {
                "metric_name": "weekly_installed_base_by_country",
                "snap_id": details['snap_id'],
                "start": end.strftime('%Y-%m-%d'),
                "end": end.strftime('%Y-%m-%d')
            }
        ]
    }

    metrics_response_json = get_publisher_metrics(json=metrics_query_json)

    active_devices = metrics_response_json['metrics'][0]
    active_devices['series'] = sorted(
        active_devices['series'],
        key=itemgetter('name')
    )
    latest_active_devices = 0

    for series_index, series in enumerate(active_devices['series']):
        for index, value in enumerate(series['values']):
            if value is None:
                active_devices['series'][series_index]['values'][index] = 0
        values = series['values']
        if len(values) == len(active_devices['buckets']):
            latest_active_devices += values[len(values)-1]

    active_devices = {
        'series': active_devices['series'],
        'buckets': active_devices['buckets']
    }

    users_by_country = public_views.normalize_metrics(
        metrics_response_json['metrics'][1]['series']
    )

    country_data = public_views.build_country_info(
        users_by_country,
        True
    )
    territories_total = 0
    for data in country_data.values():
        if data['number_of_users'] > 0:
            territories_total += 1

    context = {
        # Data direct from details API
        'snap_name': details['title'],
        'package_name': details['package_name'],
        'metric_period': metric_period,
        'active_device_metric': installed_base_metric,

        # Metrics data
        'latest_active_devices': "{:,}".format(latest_active_devices),
        'active_devices': active_devices,
        'territories_total': territories_total,
        'territories': country_data,

        # Context info
        'is_linux': 'Linux' in flask.request.headers['User-Agent']
    }

    return flask.render_template(
        'publisher/measure.html',
        **context
    )


@app.route('/account/snaps/<snap_name>/market', methods=['GET'])
@login_required
def get_market_snap(snap_name):
    snap_id = get_snap_id(snap_name)
    metadata = snap_metadata(snap_id)
    details = _transform_api_data(
        public_api.get_snap_details(snap_name)
    )

    context = {
        "snap_id": snap_id,
        "snap_name": snap_name,
        "title": metadata['title'],
        "summary": metadata['summary'],
        "description": metadata['description'],
        "license": metadata['license'],
        "details": details
    }

    return flask.render_template(
        'publisher/market.html',
        **context
    )


@app.route('/account/snaps/<snap_name>/release')
@login_required
def snap_release(snap_name):
    snap_id = get_snap_id(snap_name)
    status_json = get_snap_status(snap_id)

    return flask.render_template(
        'publisher/release.html',
        snap_name=snap_name,
        status=status_json,
    )


@app.route('/account/snaps/<snap_name>/market', methods=['POST'])
@login_required
def post_market_snap(snap_name):
    if 'submit_revert' in flask.request.form:
        flask.flash("All changes reverted.", 'information')
    else:
        error_list = []
        info = []
        images_files = []
        images_json = None

        icon = flask.request.files.get('icon')
        if icon is not None:
            info.append(build_image_info(icon, 'icon'))
            images_files.append(icon)

        screenshots = flask.request.files.getlist('screenshots')
        for screenshot in screenshots:
            info.append(build_image_info(screenshot, 'screenshot'))
            images_files.append(screenshot)

        if not images_files:
            # API requires a multipart request, but we have no files to push
            # https://github.com/requests/requests/issues/1081
            images_files = {'info': ('', dumps(info))}
        else:
            images_json = {'info': dumps(info)}

        screenshots_response = snap_screenshots(
            flask.request.form['snap_id'],
            images_json,
            images_files
        )

        if 'error_list' in screenshots_response:
            error_list = error_list + screenshots_response['error_list']

        whitelist = [
            'title',
            'summary',
            'description',
            'contact',
            'keywords',
            'license',
            'price',
            'blacklist_countries',
            'whitelist_countries'
        ]

        body_json = {
            key: flask.request.form[key]
            for key in whitelist if key in flask.request.form
        }

        metadata = snap_metadata(flask.request.form['snap_id'], body_json)
        if 'error_list' in metadata:
            error_list = error_list + metadata['error_list']

        if error_list:
            details = _transform_api_data(
                public_api.get_snap_details(snap_name)
            )

            context = {
                "snap_id": flask.request.form['snap_id'],
                "snap_name": snap_name,
                "title": details['title'],
                "summary": details['summary'],
                "description": details['description'],
                "license": details['license'],
                "details": details,
                "screenshots": screenshots_response,
                "error_list": error_list
            }

            return flask.render_template(
                'publisher/market.html',
                **context
            )

        flask.flash("Changes applied successfully.", 'positive')

    return flask.redirect(
        "/account/snaps/{snap_name}/market".format(
            snap_name=snap_name
        )
    )
