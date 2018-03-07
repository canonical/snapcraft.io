"""
A Flask application for snapcraft.io.

The web frontend for the snap store.
"""

import functools
import os
import socket
from urllib.parse import (
    unquote,
    urlparse,
    urlunparse,
)

import flask
from flask_openid import OpenID
from flask_wtf.csrf import CSRFProtect
from raven.contrib.flask import Sentry
from werkzeug.contrib.fixers import ProxyFix

import modules.authentication as authentication
import modules.public.views as public_views
import modules.publisher.views as publisher_views
from modules.macaroon import (
    MacaroonRequest,
    MacaroonResponse,
)


app = flask.Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app)
app.secret_key = os.environ['SECRET_KEY']
app.url_map.strict_slashes = False
app.sentry_public_dsn = os.getenv(
    'SENTRY_PUBLIC_DSN',
    ''
)
sentry = Sentry(app)

open_id = OpenID(
    app=app,
    stateless=True,
    safe_roots=[],
    extension_responses=[MacaroonResponse]
)

csrf = CSRFProtect(app)

LOGIN_URL = os.getenv(
    'LOGIN_URL',
    'https://login.ubuntu.com',
)


# Make LOGIN_URL available in all templates
@app.context_processor
def inject_template_variables():
    url = 'https://9e7812280c8f4ca797803145651b6e6e@sentry.io/291822'
    return {
        'LOGIN_URL': LOGIN_URL,
        'SENTRY_PUBLIC_DSN': url
    }


def login_required(func):
    """
    Decorator that checks if a user is logged in, and redirects
    to login page if not.
    """
    @functools.wraps(func)
    def is_user_logged_in(*args, **kwargs):
        if not authentication.is_authenticated(flask.session):
            return redirect_to_login()

        return func(*args, **kwargs)
    return is_user_logged_in


def redirect_to_login():
    return flask.redirect('login?next=' + flask.request.path)


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


@app.route('/create')
def create_redirect():
    return flask.redirect('https://docs.snapcraft.io/build-snaps')


# Login handler
# ===
@app.route('/login', methods=['GET', 'POST'])
@open_id.loginhandler
@csrf.exempt
def login():
    if authentication.is_authenticated(flask.session):
        return flask.redirect(open_id.get_next_url())

    root = authentication.request_macaroon()
    openid_macaroon = MacaroonRequest(
        caveat_id=authentication.get_caveat_id(root)
    )
    flask.session['macaroon_root'] = root

    return open_id.try_login(
        LOGIN_URL,
        ask_for=['email', 'nickname', 'image'],
        ask_for_optional=['fullname'],
        extensions=[openid_macaroon]
    )


@open_id.after_login
def after_login(resp):
    flask.session['openid'] = {
        'identity_url': resp.identity_url,
        'nickname': resp.nickname,
        'fullname': resp.fullname,
        'image': resp.image,
        'email': resp.email
    }

    flask.session['macaroon_discharge'] = resp.extensions['macaroon'].discharge
    return flask.redirect(open_id.get_next_url())


@app.route('/logout')
def logout():
    if authentication.is_authenticated(flask.session):
        authentication.empty_session(flask.session)
    return flask.redirect('/')


# Normal views
# ===
@app.route('/')
def homepage():
    return public_views.homepage()


@app.route('/status')
def status():
    return 'alive'


@app.route('/store')
def store():
    return public_views.store()


@app.route('/discover')
def discover():
    return flask.redirect('/store')


@app.route('/snaps')
def snaps():
    return flask.redirect('/store')


@app.route('/search')
def search_snap():
    return public_views.search_snap()


@app.route('/<snap_name>')
def snap_details(snap_name):
    return public_views.snap_details(snap_name)


# Publisher views
# ===
@app.route('/account')
@login_required
def get_account():
    return publisher_views.get_account()


@app.route('/account/agreement')
@login_required
def get_agreement():
    return publisher_views.get_agreement()


@app.route('/account/agreement', methods=['POST'])
@login_required
def post_agreement():
    return publisher_views.post_agreement()


@app.route('/account/snaps/<snap_name>/measure')
@login_required
def publisher_snap_measure(snap_name):
    return publisher_views.publisher_snap_measure(snap_name)


@app.route('/account/snaps/<snap_name>/market', methods=['GET'])
@login_required
def get_market_snap(snap_name):
    return publisher_views.get_market_snap(snap_name)


@app.route('/account/snaps/<snap_name>/release')
@login_required
def snap_release(snap_name):
    return publisher_views.snap_release(snap_name)


@app.route('/account/snaps/<snap_name>/market', methods=['POST'])
@login_required
def post_market_snap(snap_name):
    return publisher_views.post_market_snap(snap_name)
