"""
A Flask application for snapcraft.io.

The web frontend for the snap store.
"""

import bleach
import datetime
import flask
import hashlib
import humanize
import modules.cache as cache
import modules.authentication as authentication
import os
import pycountry
import re
import socket
from dateutil import parser, relativedelta
from flask_openid import OpenID
from flask_wtf.csrf import CSRFProtect
from functools import wraps
from json import dumps
from math import floor
from modules.macaroon import MacaroonRequest, MacaroonResponse
from operator import itemgetter
from urllib.parse import parse_qs, unquote, urlparse, urlunparse
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

FEATURE_SNAPS_URL = ''.join([
    SNAPCRAFT_IO_API,
    'snaps/search',
    '?confinement=strict,classic&q=&section=featured',
])

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

PROMOTED_QUERY_URL = ''.join([
    SNAPCRAFT_IO_API,
    'snaps/search',
    '?promoted=true',
    '&confinement=strict,classic',
])
PROMOTED_QUERY_HEADERS = {
    'X-Ubuntu-Series': '16'
}

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


def login_required(func):
    @wraps(func)
    def is_user_logged_in(*args, **kwargs):
        if not authentication.is_authenticated(flask.session):
            return redirect_to_login()

        return func(*args, **kwargs)
    return is_user_logged_in


def redirect_to_login():
    return flask.redirect('login?next=' + flask.request.url_rule.rule)


def normalize_searched_snaps(search_results):
    return (
        search_results['_embedded']['clickindex:package']
        if search_results['_embedded']
        else []
    )


def get_public_metrics(snap_name, json):
    metrics_response = cache.get(
        SNAP_METRICS_URL.format(snap_name=snap_name),
        headers=METRICS_QUERY_HEADERS,
        json=json
    )

    return metrics_response.json()


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


def get_snap_id(snap_name):
    snap_details = get_snap_details(snap_name)
    return snap_details['snap_id']


def calculate_color(thisCountry, maxCountry, maxColor, minColor):
    countryFactor = float(thisCountry)/maxCountry
    colorRange = maxColor - minColor
    return int(colorRange*countryFactor+minColor)


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


def calculate_colors(countries, max_users):
    for country_code in countries:
        countries[country_code]['color_rgb'] = [
            calculate_color(
                countries[country_code]['percentage_of_users'],
                max_users,
                8,
                229
            ),
            calculate_color(
                countries[country_code]['percentage_of_users'],
                max_users,
                64,
                245
            ),
            calculate_color(
                countries[country_code]['percentage_of_users'],
                max_users,
                129,
                223
            )
        ]


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


def convert_limit_offset_to_size_page(link):
    url_parsed = urlparse(link)
    host_url = (
        "{base_url}"
        "?q={q}&limit={limit}&offset={offset}"
    )

    url_queries = parse_qs(url_parsed.query)
    q = url_queries['q'][0]
    size = int(url_queries['size'][0])
    page = int(url_queries['page'][0])

    return host_url.format(
        base_url=flask.request.base_url,
        q=q,
        limit=size,
        offset=size*(page-1)
    )


def get_pages_details(links):

    links_result = {}

    if('first' in links):
        links_result['first'] = convert_limit_offset_to_size_page(
            links['first']['href']
        )

    if('last' in links):
        links_result['last'] = convert_limit_offset_to_size_page(
            links['last']['href']
        )

    if('next' in links):
        links_result['next'] = convert_limit_offset_to_size_page(
            links['next']['href']
        )

    if('prev' in links):
        links_result['prev'] = convert_limit_offset_to_size_page(
            links['prev']['href']
        )

    if('self' in links):
        links_result['self'] = convert_limit_offset_to_size_page(
            links['self']['href']
        )

    return links_result


# Normal views
# ===
@app.route('/')
def homepage():
    return flask.render_template(
        'index.html',
        featured_snaps=get_featured_snaps()
    )


@app.route('/store')
def store():
    return flask.render_template(
        'store.html',
        featured_snaps=get_featured_snaps(),
        page_slug='store'
    )


@app.route('/discover')
def discover():
    return flask.redirect('/store')


@app.route('/snaps')
def snaps():
    return flask.render_template(
        'promoted.html',
        snaps=get_promoted_snaps()
    )


@app.route('/search')
def search_snap():
    snap_searched = flask.request.args.get('q', default='', type=str)
    if(not snap_searched):
        return flask.redirect('/store')

    size = flask.request.args.get('limit', default=10, type=int)
    offset = flask.request.args.get('offset', default=0, type=int)

    page = floor(offset / size) + 1

    searched_results = get_searched_snaps(snap_searched, size, page)

    context = {
        "query": snap_searched,
        "snaps": normalize_searched_snaps(searched_results),
        "links": get_pages_details(searched_results['_links'])
    }

    return flask.render_template(
        'search.html',
        **context
    )


@app.route('/<snap_name>')
def snap_details(snap_name):
    """
    A view to display the snap details page for specific snaps.

    This queries the snapcraft API (api.snapcraft.io) and passes
    some of the data through to the snap-details.html template,
    with appropriate sanitation.
    """

    today = datetime.datetime.utcnow().date()
    week_ago = today - relativedelta.relativedelta(weeks=1)

    details = get_snap_details(snap_name)

    metrics_query_json = [
        {
            "metric_name": "installed_base_by_country_percent",
            "snap_id": details['snap_id'],
            "start": week_ago.strftime('%Y-%m-%d'),
            "end": today.strftime('%Y-%m-%d')
        }
    ]

    metrics_response = get_public_metrics(
        snap_name,
        metrics_query_json
    )

    users_by_country = normalize_metrics(
        metrics_response[0]['series']
    )
    country_data = build_country_info(users_by_country)

    description = details['description'].strip()
    paragraphs = re.compile(r'[\n\r]{2,}').split(description)
    formatted_paragraphs = []

    # Sanitise paragraphs
    def external(attrs, new=False):
        url_parts = urlparse(attrs[(None, "href")])
        if url_parts.netloc and url_parts.netloc != 'snapcraft.io':
            if (None, "class") not in attrs:
                attrs[(None, "class")] = "p-link--external"
            elif "p-link--external" not in attrs[(None, "class")]:
                attrs[(None, "class")] += " p-link--external"

        return attrs

    for paragraph in paragraphs:
        callbacks = bleach.linkifier.DEFAULT_CALLBACKS
        callbacks.append(external)

        paragraph = bleach.clean(paragraph, tags=[])
        paragraph = bleach.linkify(paragraph, callbacks=callbacks)

        formatted_paragraphs.append(paragraph.replace('\n', '<br />'))

    context = {
        # Data direct from details API
        'snap_title': details['title'],
        'package_name': details['package_name'],
        'icon_url': details['icon_url'],
        'version': details['version'],
        'revision': details['revision'],
        'license': details['license'],
        'publisher': details['publisher'],
        'screenshot_urls': details['screenshot_urls'],
        'prices': details['prices'],
        'support_url': details.get('support_url'),
        'summary': details['summary'],
        'description_paragraphs': formatted_paragraphs,

        # Transformed API data
        'filesize': humanize.naturalsize(details['binary_filesize']),
        'last_updated': (
            humanize.naturaldate(
                parser.parse(details.get('last_updated'))
            )
        ),

        # Data from metrics API
        'countries': country_data,

        # Context info
        'is_linux': (
            'Linux' in flask.request.headers['User-Agent'] and
            'Android' not in flask.request.headers['User-Agent']
        )
    }

    return flask.render_template(
        'snap-details.html',
        **context
    )


def normalize_metrics(geodata):
    users_by_country = {}
    max_users = 0.0
    for country_counts in geodata:
        country_code = country_counts['name']
        users_by_country[country_code] = {}
        counts = []
        for daily_count in country_counts['values']:
            if daily_count is not None:
                counts.append(daily_count)

        if len(counts) > 0:
            users_by_country[country_code]['number_of_users'] = (
                sum(counts)
            )
            users_by_country[country_code]['percentage_of_users'] = (
                sum(counts) / len(counts)
            )
        else:
            users_by_country[country_code]['number_of_users'] = 0
            users_by_country[country_code]['percentage_of_users'] = 0

        if max_users < users_by_country[country_code]['percentage_of_users']:
            max_users = users_by_country[country_code]['percentage_of_users']

    calculate_colors(users_by_country, max_users)

    return users_by_country


def build_country_info(users_by_country, display_number_users=False):
    country_data = {}
    for country in pycountry.countries:
        country_info = users_by_country.get(country.alpha_2)
        number_of_users = 0
        percentage_of_users = 0
        color_rgb = [229, 245, 223]
        if country_info is not None:
            if display_number_users:
                number_of_users = country_info['number_of_users'] or 0
            percentage_of_users = country_info['percentage_of_users'] or 0
            color_rgb = country_info['color_rgb'] or [229, 245, 223]

        country_data[country.numeric] = {
            'name': country.name,
            'code': country.alpha_2,
            'percentage_of_users': percentage_of_users,
            'color_rgb': color_rgb
        }

        if display_number_users:
            country_data[country.numeric]['number_of_users'] = number_of_users

    return country_data


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

    details = get_snap_details(snap_name)

    today = datetime.datetime.utcnow().date()
    end = today - relativedelta.relativedelta(days=1)
    device_change = 'weekly_device_change'
    start = None
    if metric_bucket == 'd':
        start = end - relativedelta.relativedelta(days=metric_period_int)
    elif metric_bucket == 'm':
        start = end - relativedelta.relativedelta(months=metric_period_int)
    elif metric_bucket == 'y':
        start = end - relativedelta.relativedelta(years=metric_period_int)
    metrics_query_json = {
        "filters": [
            {
                "metric_name": device_change,
                "snap_id": details['snap_id'],
                "start": start.strftime('%Y-%m-%d'),
                "end": end.strftime('%Y-%m-%d')
            },
            {
                "metric_name": "installed_base_by_version",
                "snap_id": details['snap_id'],
                "start": start.strftime('%Y-%m-%d'),
                "end": end.strftime('%Y-%m-%d')
            },
            {
                "metric_name": "installed_base_by_country",
                "snap_id": details['snap_id'],
                "start": start.strftime('%Y-%m-%d'),
                "end": end.strftime('%Y-%m-%d')
            }
        ]
    }

    metrics_response_json = get_publisher_metrics(json=metrics_query_json)

    installs_metrics = {
        'values': [],
        'buckets': metrics_response_json['metrics'][0]['buckets']
    }
    for index in metrics_response_json['metrics'][0]['series']:
        series_list = metrics_response_json['metrics'][0]['series']
        for series in series_list:
            if series['name'] == 'new':
                installs_metrics['values'] = series['values']
                break
    installs_total = 0

    for index, value in enumerate(installs_metrics['values']):
        if value is None:
            installs_metrics['values'][index] = 0
        else:
            installs_total += value

    active_devices = metrics_response_json['metrics'][1]
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

    users_by_country = normalize_metrics(
        metrics_response_json['metrics'][2]['series']
    )

    country_data = build_country_info(
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

        # Metrics data
        'installs_total': "{:,}".format(installs_total),
        'installs': installs_metrics,
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
        get_snap_details(snap_name)
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
            'contact_url',
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
                get_snap_details(snap_name)
            )

            context = {
                "snap_id": flask.request.form['snap_id'],
                "snap_name": snap_name,
                "title": metadata['title'],
                "summary": metadata['summary'],
                "description": metadata['description'],
                "license": metadata['license'],
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
