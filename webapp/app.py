"""
A Flask application for snapcraft.io.

The web frontend for the snap store.
"""

# Core packages
import os

# Third-party packages
import flask
import talisker.flask
import prometheus_flask_exporter
from flask_wtf.csrf import CSRFProtect
from raven.contrib.flask import Sentry
from werkzeug.contrib.fixers import ProxyFix
from werkzeug.debug import DebuggedApplication

# Local webapp
import webapp.helpers as helpers
from webapp.handlers import set_handlers
from webapp.blog.views import blog
from webapp.public.views import store
from webapp.publisher.views import account
from webapp.snapcraft.views import snapcraft
from webapp.login.views import login


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


csrf = CSRFProtect()
sentry = Sentry()


def create_app(testing=False):
    app = flask.Flask(
        __name__, template_folder='../templates', static_folder='../static')

    app.wsgi_app = ProxyFix(app.wsgi_app)
    if app.debug:
        app.wsgi_app = DebuggedApplication(app.wsgi_app)

    app.secret_key = os.environ['SECRET_KEY']
    app.url_map.strict_slashes = False
    app.url_map.converters['regex'] = helpers.RegexConverter

    if not testing:
        talisker.flask.register(app)
        app.config['SENTRY_CONFIG'] = {
            'release': COMMIT_ID,
            'environment': ENVIRONMENT
        }

        prometheus_flask_exporter.PrometheusMetrics(
            app,
            group_by_endpoint=True,
            buckets=[0.25, 0.5, 0.75, 1, 2],
            path=None
        )

        init_extensions(app)

    set_handlers(app, LOGIN_URL, SENTRY_PUBLIC_DSN, COMMIT_ID, ENVIRONMENT)

    return app


def create_brandstore(testing=False):
    app = create_app(testing)
    app.register_blueprint(store)

    return app


def create_snapcraft(testing=False):
    app = create_app(testing)

    app.register_blueprint(snapcraft)
    app.register_blueprint(login)
    csrf.exempt('webapp.login.views.login_handler')
    app.register_blueprint(store)
    app.register_blueprint(account, url_prefix='/account')
    app.register_blueprint(blog, url_prefix='/blog')

    return app


def init_extensions(app):
    csrf.init_app(app)
    sentry.init_app(app)
