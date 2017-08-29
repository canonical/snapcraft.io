from flask import abort, Flask, render_template
from requests_cache import CachedSession
from dateutil import parser
import json
import humanize


app = Flask(__name__)
cached_request = CachedSession(
    expire_after=60,
    old_data_on_error=True
)
snap_details_url = (
    "https://api.snapcraft.io/api/v1/snaps/details/{snap_name}"
    "?channel=stable"
)


@app.errorhandler(404)
def page_not_found(error):
    return render_template('404.html', description=error.description), 404


@app.route('/<snap_name>/')
def snap_details(snap_name):
    query_headers = {
        'X-Ubuntu-Series': '16',
    }

    response = cached_request.get(
        snap_details_url.format(snap_name=snap_name),
        headers=query_headers,
        timeout=2
    )

    if response.status_code >= 400:
        message = (
            'Failed to get snap details for {snap_name}'.format(**locals())
        )

        if response.status_code == 404:
            message = 'Snap not found: {snap_name}'.format(**locals())

        abort(response.status_code, message)

    snap_data = json.loads(response.text)

    context = {
        # Always available
        'name': snap_data['title'],
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

    return render_template(
        'snap-details.html',
        **context
    )
