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
from dateutil import parser


app = flask.Flask(__name__)
uncached_session = requests.Session()
cached_session = requests_cache.CachedSession(expire_after=60)
request_timeout = 2
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

    context = {
        # Always available
        'name': snap_data['title'],
        'api_error': response.old_data_from_error,
        'version': snap_data['version'],
        'revision': snap_data['revision'],
        'filesize': humanize.naturalsize(snap_data['binary_filesize']),
        'download_url': snap_data['download_url'],
        'publisher': snap_data['publisher'],
        'screenshot_urls': snap_data['screenshot_urls'],
        'prices': snap_data['prices'],
        'support_url': snap_data.get('support_url'),
        'last_updated': (
            humanize.naturaldate(
                parser.parse(snap_data.get('last_updated'))
            )
        ),

        # May be available
        'summary': snap_data.get('summary'),
        'description': snap_data.get('description'),
        'icon_url': snap_data.get('icon_url'),
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
