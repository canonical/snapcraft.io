"""
A Flask application for snapcraft.io.

The web frontend for the snap store.
"""

import flask
import requests
import requests_cache
import datetime
import json
import humanize
import re
import bleach
import urllib
from dateutil import parser
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

    query_headers = {
        'X-Ubuntu-Series': '16',
        'X-Ubuntu-Architecture': 'amd64',
    }

    response = _get_from_cache(
        snap_details_url.format(snap_name=snap_name),
        headers=query_headers
    )

    if response.status_code >= 400:
        message = (
            'Failed to get snap details for {snap_name}'.format(**locals())
        )

        if response.status_code == 404:
            message = 'Snap not found: {snap_name}'.format(**locals())

        flask.abort(response.status_code, message)

    snap_data = json.loads(response.text)
    description = snap_data['description'].strip()
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
        # Data direct from API
        'snap_title': snap_data['title'],
        'package_name': snap_data['package_name'],
        'icon_url': snap_data['icon_url'],
        'version': snap_data['version'],
        'revision': snap_data['revision'],
        'publisher': snap_data['publisher'],
        'screenshot_urls': snap_data['screenshot_urls'],
        'prices': snap_data['prices'],
        'support_url': snap_data.get('support_url'),
        'summary': snap_data['summary'],
        'description_paragraphs': formatted_paragraphs,

        # Transformed API data
        'filesize': humanize.naturalsize(snap_data['binary_filesize']),
        'last_updated': (
            humanize.naturaldate(
                parser.parse(snap_data.get('last_updated'))
            )
        ),

        # Context info
        'api_error': response.old_data_from_error,
        'is_linux': 'Linux' in flask.request.headers['User-Agent']
    }

    return flask.render_template(
        'snap-details.html',
        **context
    )


def _get_from_cache(url, headers):
    """
    Retrieve the response from the requests cache.
    If the cache has expired then it will attempt to update the cache.
    If it gets an error, it will use the cached response, if it exists.
    """

    request_error = False

    request = cached_session.prepare_request(
        requests.Request(
            method='GET',
            url=url,
            headers=headers
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
