"""
A Flask application for snapcraft.io.

The web frontend for the snap store.
"""

import authentication
import flask
import requests
import requests_cache
import datetime
import humanize
import re
import bleach
import urllib
import pycountry
import os
import socket
from dateutil import parser, relativedelta
from flask_openid import OpenID
from macaroon import MacaroonRequest, MacaroonResponse
from math import floor
from requests.packages.urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
from requests.exceptions import RequestException
from urllib.parse import urlparse, parse_qs
from operator import itemgetter


app = flask.Flask(__name__)
app.secret_key = os.environ['SECRET_KEY']

# Setup session to retry requests 5 times
uncached_session = requests.Session()
retries = Retry(
    total=5,
    backoff_factor=0.1,
    status_forcelist=[500, 502, 503, 504]
)
uncached_session.mount(
    'https://api.stagin.snapcraft.io',
    HTTPAdapter(max_retries=retries)
)

oid = OpenID(
    app,
    safe_roots=[],
    extension_responses=[MacaroonResponse]
)

# The cache expires after 5 seconds
cached_session = requests_cache.CachedSession(expire_after=5)

# Requests should timeout after 2 seconds in total
request_timeout = 2

# Request only stable snaps
snap_details_url = (
    "https://api.staging.snapcraft.io/api/v1/snaps/details/{snap_name}"
    "?channel=stable"
)
details_query_headers = {
    'X-Ubuntu-Series': '16',
    'X-Ubuntu-Architecture': 'amd64',
}

snap_metrics_url = "https://api.staging.snapcraft.io/api/v1/snaps/metrics"
metrics_query_headers = {
    'Content-Type': 'application/json'
}

snap_publisher_metrics_url = "https://dashboard.staging.snapcraft.io/dev/api/snaps/metrics"
publisher_metrics_query_headers = {
    'Content-Type': 'application/json'
}

snap_search_url = (
    "https://search.apps.ubuntu.com/api/v1/snaps/search"
    "?q={snap_name}&page={page}&size={size}"
    "&confinement=strict,classic"
)
search_query_headers = {
    'X-Ubuntu-Frameworks': '*',
    'X-Ubuntu-Architecture': 'amd64',
    'Accept': 'application/hal+json'
}

promoted_query_url = (
    "https://api.staging.snapcraft.io/api/v1/snaps/search"
    "?promoted=true"
    "&confinement=strict,classic"
)
promoted_query_headers = {
    'X-Ubuntu-Series': '16'
}


def redirect_to_login():
    return flask.redirect(''.join([
        'login?next=',
        flask.request.url_rule.rule,
    ]))


def get_searched_snaps(search_results):
    return (
        search_results['_embedded']['clickindex:package']
        if search_results['_embedded']
        else []
    )


def get_featured_snaps():
    url = (
        "https://api.staging.snapcraft.io/api/v1/snaps/search"
        "?confinement=strict,classic&q=&section=featured"
    )

    featured_response = _get_from_cache(
        url,
        headers=search_query_headers
    )

    return get_searched_snaps(featured_response.json())


def get_promoted_snaps():
    promoted_response = _get_from_cache(
        promoted_query_url,
        headers=promoted_query_headers
    )

    return get_searched_snaps(promoted_response.json())


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
@app.route('/docs/', defaults={'path': ''})
@app.route('/docs/<path:path>')
def docs_redirect(path):
    return flask.redirect('https://docs.snapcraft.io/' + path)


@app.route('/community/')
def community_redirect():
    return flask.redirect('/')


@app.route('/login', methods=['GET', 'POST'])
@oid.loginhandler
def login():
    if authentication.is_authenticated(flask.session):
        return flask.redirect(oid.get_next_url())

    root = authentication.request_macaroon()
    openid_macaroon = MacaroonRequest(
        caveat_id=authentication.get_caveat_id(root)
    )
    flask.session['macaroon_root'] = root

    return oid.try_login(
        'https://login.staging.ubuntu.com',
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
def get_account():
    if not authentication.is_authenticated(flask.session):
        return redirect_to_login()

    authorization = authentication.get_authorization_header(
        flask.session['macaroon_root'],
        flask.session['macaroon_discharge']
    )

    headers = {
        'X-Ubuntu-Series': '16',
        'X-Ubuntu-Architecture': 'amd64',
        'Authorization': authorization
    }

    url = 'https://dashboard.staging.snapcraft.io/dev/api/account'
    response = requests.request(url=url, method='GET', headers=headers)

    verified_response = authentication.verify_response(
        response,
        flask.session,
        url,
        '/account',
        '/login'
    )

    if verified_response is not None:
        if verified_response['redirect'] is None:
            return response.raise_for_status
        else:
            return flask.redirect(
                verified_response.redirect
            )

    print('HTTP/1.1 {} {}'.format(response.status_code, response.reason))

    user_snaps = response.json()
    return flask.render_template(
        'account.html',
        user_snaps=user_snaps['snaps']['16'],
        user=flask.session['openid']
    )


@app.route('/create/')
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


@app.route('/discover/')
def discover():
    return flask.render_template(
        'discover.html',
        featured_snaps=get_featured_snaps()
    )


@app.route('/snaps/')
def snaps():
    return flask.render_template(
        'promoted.html',
        snaps=get_promoted_snaps()
    )


@app.route('/search')
def search_snap():
    snap_searched = flask.request.args.get('q', default='', type=str)
    if(not snap_searched):
        return flask.redirect('/discover')

    size = flask.request.args.get('limit', default=10, type=int)
    offset = flask.request.args.get('offset', default=0, type=int)

    page = floor(offset / size) + 1

    searched_response = _get_from_cache(
        snap_search_url.format(
            snap_name=snap_searched,
            size=size,
            page=page
        ),
        headers=search_query_headers
    )

    searched_results = searched_response.json()

    context = {
        "query": snap_searched,
        "snaps": get_searched_snaps(searched_response.json()),
        "links": get_pages_details(searched_results['_links'])
    }

    return flask.render_template(
        'search.html',
        **context
    )


@app.route('/<snap_name>/')
def snap_details(snap_name):
    """
    A view to display the snap details page for specific snaps.

    This queries the snapcraft API (api.snapcraft.io) and passes
    some of the data through to the snap-details.html template,
    with appropriate sanitation.
    """

    today = datetime.datetime.utcnow().date()
    week_ago = today - relativedelta.relativedelta(weeks=1)

    details_response = _get_from_cache(
        snap_details_url.format(snap_name=snap_name),
        headers=details_query_headers
    )
    details = details_response.json()

    if details_response.status_code >= 400:
        message = (
            'Failed to get snap details for {snap_name}'.format(**locals())
        )

        if details_response.status_code == 404:
            message = 'Snap not found: {snap_name}'.format(**locals())

        flask.abort(details_response.status_code, message)

    metrics_query_json = [
        {
            "metric_name": "installed_base_by_country_percent",
            "snap_id": details['snap_id'],
            "start": week_ago.strftime('%Y-%m-%d'),
            "end": today.strftime('%Y-%m-%d')
        }
    ]
    metrics_response = _get_from_cache(
        snap_metrics_url.format(snap_name=snap_name),
        headers=metrics_query_headers,
        json=metrics_query_json
    )

    geodata = metrics_response.json()[0]['series']

    # Normalise geodata from API
    users_by_country = {}
    for country_percentages in geodata:
        country_code = country_percentages['name']
        percentages = []
        for daily_percent in country_percentages['values']:
            if daily_percent is not None:
                percentages.append(daily_percent)

        if len(percentages) > 0:
            users_by_country[country_code] = (
                sum(percentages) / len(percentages)
            )
        else:
            users_by_country[country_code] = None

    # Build up country info for every country
    country_data = {}
    for country in pycountry.countries:
        country_data[country.numeric] = {
            'name': country.name,
            'code': country.alpha_2,
            'percentage_of_users': users_by_country.get(country.alpha_2)
        }

    description = details['description'].strip()
    paragraphs = re.compile(r'[\n\r]{2,}').split(description)
    formatted_paragraphs = []

    # Sanitise paragraphs
    def external(attrs, new=False):
        url_parts = urllib.parse.urlparse(attrs[(None, "href")])
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
        'details_api_error': details_response.old_data_from_error,
        'metrics_api_error': metrics_response.old_data_from_error,
        'is_linux': 'Linux' in flask.request.headers['User-Agent']
    }

    return flask.render_template(
        'snap-details.html',
        **context
    )


def _get_from_cache(url, headers, json=None):
    """
    Retrieve the response from the requests cache.
    If the cache has expired then it will attempt to update the cache.
    If it gets an error, it will use the cached response, if it exists.
    """

    request_error = False

    method = "POST" if json else "GET"

    request = cached_session.prepare_request(
        requests.Request(
            method=method,
            url=url,
            headers=headers,
            json=json
        )
    )

    cache_key = cached_session.cache.create_key(request)
    response, timestamp = cached_session.cache.get_response_and_time(
        cache_key
    )

    if response:
        age = datetime.datetime.utcnow() - timestamp

        if age > cached_session._cache_expire_after:
            try:
                new_response = uncached_session.send(
                    request,
                    timeout=request_timeout
                )
                if response.status_code >= 500:
                    new_response.raise_for_status()
            except RequestException:
                request_error = True
            else:
                response = new_response
    else:
        response = cached_session.send(request)

    response.old_data_from_error = request_error

    return response


# Publisher views
# ===
@app.route('/account/snaps/<snap_name>/measure/')
def publisher_snap(snap_name):
    """
    A view to display the snap measure page for specific snaps.

    This queries the snapcraft API (api.snapcraft.io) and passes
    some of the data through to the publisher/measure.html template,
    with appropriate sanitation.
    """
    if not authentication.is_authenticated(flask.session):
        return redirect_to_login()

    metric_period = flask.request.args.get('period', default='30d', type=str)
    metric_period_int = int(metric_period[:-1])

    details_response = _get_from_cache(
        snap_details_url.format(snap_name=snap_name),
        headers=details_query_headers
    )
    details = details_response.json()

    if details_response.status_code >= 400:
        message = (
            'Failed to get snap details for {snap_name}'.format(**locals())
        )

        if details_response.status_code == 404:
            message = 'Snap not found: {snap_name}'.format(**locals())

        flask.abort(details_response.status_code, message)

    # Dummy data

    today = datetime.datetime.utcnow().date()
    month_ago = today - relativedelta.relativedelta(months=1)
    metrics_query_json = {
        "filters": [
            {
                "metric_name": "daily_device_change",
                "snap_id": details['snap_id'],
                "start": month_ago.strftime('%Y-%m-%d'),
                "end": today.strftime('%Y-%m-%d')
            },
            {
                "metric_name": "installed_base_by_version",
                "snap_id": details['snap_id'],
                "start": month_ago.strftime('%Y-%m-%d'),
                "end": today.strftime('%Y-%m-%d')
            },
            {
                "metric_name": "installed_base_by_country",
                "snap_id": details['snap_id'],
                "start": month_ago.strftime('%Y-%m-%d'),
                "end": today.strftime('%Y-%m-%d')
            }
        ]
    }

    authed_metrics_headers = publisher_metrics_query_headers.copy()
    authed_metrics_headers['Authorization'] = authentication.get_authorization_header(
        flask.session['macaroon_root'],
        flask.session['macaroon_discharge']
    )

    metrics_response = _get_from_cache(
        snap_publisher_metrics_url,
        headers=authed_metrics_headers,
        json=metrics_query_json
    )

    metrics_response_json = metrics_response.json()

    days = metrics_response_json['metrics'][0]['buckets']

    installs_metrics = []
    for index in metrics_response_json['metrics'][0]['series']:
        series_list = metrics_response_json['metrics'][0]['series']
        for series in series_list:
            if series['name'] == 'new':
                installs_metrics = series
                break
    installs_total = 0

    for index, value in enumerate(installs_metrics['values']):
        if value == None:
            installs_metrics['values'][index] = 0
        else:
            installs_total += value

    active_devices = metrics_response_json['metrics'][1]['series']
    active_devices = sorted(active_devices, key=itemgetter('name'))
    latest_active_devices = 0

    for series_index, series in enumerate(active_devices):
        for index, value in enumerate(series['values']):
            if value == None:
                active_devices[series_index]['values'][index] = 0
        values = series['values']
        if len(values) == len(days):
            latest_active_devices += values[len(values)-1]

    geodata = metrics_response_json['metrics'][2]['series']
    geodata = []
    # Normalise geodata from API
    users_by_country = {}
    for country_counts in geodata:
        country_code = country_counts['name']
        count = []
        for daily_count in country_counts['values']:
            if daily_count is not None:
                count.append(daily_count)

        if len(count) > 0:
            users_by_country[country_code] = (
                sum(count)
            )

    # Build up country info for every country
    country_data = {}
    territories_total = 0
    for country in pycountry.countries:
        number_of_users = users_by_country.get(country.alpha_2)
        if number_of_users == None:
            number_of_users = 0
        if number_of_users is not None and number_of_users > 0:
            territories_total += 1
        country_data[country.numeric] = {
            'name': country.name,
            'code': country.alpha_2,
            'number_of_users': number_of_users
        }

    context = {
        # Data direct from details API
        'snap_title': details['title'],
        'package_name': details['package_name'],
        'metric_period': metric_period_int,

        # Metrics data
        'days': days,
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
