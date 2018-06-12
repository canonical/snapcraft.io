"""
A Flask application for snapcraft.io.

The web frontend for the snap store.
"""

# Core packages
import os
import socket
from urllib.parse import (
    unquote,
    urlparse,
    urlunparse,
)

# Third-party packages
import flask
import talisker.flask
import prometheus_flask_exporter
from canonicalwebteam.snapstoreapi import authentication
from flask_wtf.csrf import CSRFProtect
from raven.contrib.flask import Sentry
from werkzeug.contrib.fixers import ProxyFix
from werkzeug.debug import DebuggedApplication

# Local webapp
import webapp.helpers as helpers
import webapp.template_functions as template_functions
from webapp.blog.views import blog
from webapp.public.views import store
from webapp.publisher.views import account
from webapp.snapcraft.views import snapcraft
from webapp.login.views import login

app = flask.Flask(
    __name__, template_folder='../templates', static_folder='../static')
talisker.flask.register(app)
app.wsgi_app = ProxyFix(app.wsgi_app)
if app.debug:
    app.wsgi_app = DebuggedApplication(app.wsgi_app)
app.secret_key = os.environ['SECRET_KEY']
app.url_map.strict_slashes = False
app.url_map.converters['regex'] = helpers.RegexConverter
sentry = Sentry(app)

metrics = prometheus_flask_exporter.PrometheusMetrics(
    app,
    group_by_endpoint=True,
    buckets=[0.25, 0.5, 0.75, 1, 2],
    path=None
)

csrf = CSRFProtect(app)

SENTRY_PUBLIC_DSN = os.getenv('SENTRY_PUBLIC_DSN', '').strip()
LOGIN_URL = os.getenv(
    'LOGIN_URL',
    'https://login.ubuntu.com',
)

ENVIRONMENT = os.getenv(
    'ENVIRONMENT',
    'devel'
)
COMMIT_ID = os.getenv(
    'COMMIT_ID',
    'commit_id'
)

app.config['SENTRY_CONFIG'] = {
    'release': COMMIT_ID,
    'environment': ENVIRONMENT
}


@app.context_processor
def utility_processor():
    """
    This defines the set of properties and functions that will be added
    to the default context for processing templates. All these items
    can be used in all templates
    """

    if authentication.is_authenticated(flask.session):
        user_name = flask.session['openid']['fullname']
    else:
        user_name = None

    return {
        # Variables
        'LOGIN_URL': LOGIN_URL,
        'SENTRY_PUBLIC_DSN': SENTRY_PUBLIC_DSN,
        'COMMIT_ID': COMMIT_ID,
        'ENVIRONMENT': ENVIRONMENT,
        'path': flask.request.path,
        'user_name': user_name,
        'VERIFIED_PUBLISHER': 'verified',

        # Functions
        'contains': template_functions.contains,
        'join': template_functions.join,
        'static_url': template_functions.static_url,
        'format_number': template_functions.format_number,
    }


# Error handlers
# ===
@app.errorhandler(404)
def page_not_found(error):
    """
    For 404 pages, display the 404.html template,
    passing through the error description.
    """

    return flask.render_template(
        '404.html', error=error.description
    ), 404


# Global tasks for all requests
# ===
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


@app.after_request
def add_headers(response):
    """
    Generic rules for headers to add to all requests

    - X-Hostname: Mention the name of the host/pod running the application
    - Cache-Control: Add cache-control headers for public and private pages
    """

    response.headers["X-Hostname"] = socket.gethostname()

    if response.status_code == 200:
        if flask.session:
            response.headers['Cache-Control'] = 'private'
        else:
            # Only add caching headers to successful responses
            response.headers['Cache-Control'] = ', '.join({
                'public',
                'max-age=61',
                'stale-while-revalidate=300',
                'stale-if-error=86400',
            })

    return response


app.register_blueprint(snapcraft)
app.register_blueprint(login)
csrf.exempt('webapp.login.views.login_handler')
app.register_blueprint(store)
app.register_blueprint(account, url_prefix='/account')
app.register_blueprint(blog, url_prefix='/blog')
