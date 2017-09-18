"""
A Flask application for snapcraft.io.

The web frontend for the snap store.
"""

import flask
import requests
import requests_cache
import datetime
import humanize
import re
import bleach
import urllib
from dateutil import parser, relativedelta
from requests.packages.urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter


app = flask.Flask(__name__)

# Setup session to retry requests 5 times
uncached_session = requests.Session()
retries = Retry(
    total=5,
    backoff_factor=0.1,
    status_forcelist=[500, 502, 503, 504]
)
uncached_session.mount(
    'https://api.snapcraft.io',
    HTTPAdapter(max_retries=retries)
)

# The cache expires after 5 seconds
cached_session = requests_cache.CachedSession(expire_after=5)

# Requests should timeout after 2 seconds in total
request_timeout = 2

# Request only stable snaps
snap_details_url = (
    "https://api.snapcraft.io/api/v1/snaps/details/{snap_name}"
    "?channel=stable"
)
details_query_headers = {
    'X-Ubuntu-Series': '16',
    'X-Ubuntu-Architecture': 'amd64',
}

snap_metrics_url = "https://api.snapcraft.io/api/v1/snaps/metrics"
metrics_query_headers = {
    'Content-Type': 'application/json'
}


@app.errorhandler(404)
def page_not_found(error):
    """
    For 404 pages, display the 404.html template,
    passing through the error description.
    """

    return flask.render_template(
        '404.html', description=error.description
    ), 404


@app.route('/<snap_name>/')
def snap_details(snap_name):
    """
    A view to display the snap details page for specific snaps.

    This queries the snapcraft API (api.snapcraft.io) and passes
    some of the data through to the snap-details.html template,
    with appropriate sanitation.
    """
    today = datetime.date.today()
    month_ago = today - relativedelta.relativedelta(months=1)

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
            "start": month_ago.strftime('%Y-%m-%d'),
            "end": today.strftime('%Y-%m-%d')
        }
    ]
    metrics_response = _get_from_cache(
        snap_metrics_url.format(snap_name=snap_name),
        headers=metrics_query_headers,
        json=metrics_query_json
    )
    geodata = metrics_response.json()[0]['series']

    user_percentage_by_country = {}

    for country_percentages in geodata:
        country_code = country_percentages['name']
        percentages_with_nulls = country_percentages['values']
        percentages = [p for p in percentages_with_nulls if p is not None]
        average_percentage = sum(percentages) / len(percentages)
        user_percentage_by_country[country_code] = average_percentage

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

        formatted_paragraphs.append(paragraph)

    context = {
        # Data direct from details API
        'snap_title': details['title'],
        'package_name': details['package_name'],
        'icon_url': details['icon_url'],
        'version': details['version'],
        'revision': details['revision'],
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
        'user_percentage_by_country': user_percentage_by_country,

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
            except:
                request_error = True
            else:
                response = new_response
    else:
        response = cached_session.send(request)

    response.old_data_from_error = request_error

    return response
