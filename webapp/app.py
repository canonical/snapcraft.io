"""
A Flask application for snapcraft.io.

The web frontend for the snap store.
"""

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
from webapp.public.views import store_blueprint
from webapp.publisher.views import account
from webapp.publisher.snaps.views import publisher_snaps
from webapp.snapcraft.views import snapcraft_blueprint
from webapp.login.views import login


csrf = CSRFProtect()
sentry = Sentry()


def create_app(testing=False):
    app = flask.Flask(
        __name__, template_folder='../templates', static_folder='../static')

    app.config.from_object('webapp.config')
    app.testing = testing

    app.wsgi_app = ProxyFix(app.wsgi_app)
    if app.debug:
        app.wsgi_app = DebuggedApplication(app.wsgi_app)

    app.url_map.strict_slashes = False
    app.url_map.converters['regex'] = helpers.RegexConverter

    if not testing:
        talisker.flask.register(app)

        prometheus_flask_exporter.PrometheusMetrics(
            app,
            group_by_endpoint=True,
            buckets=[0.25, 0.5, 0.75, 1, 2],
            path=None
        )

        init_extensions(app)

    app.config.from_object('webapp.configs.' + app.config['WEBAPP'])
    set_handlers(app)

    if app.config['WEBAPP'] == 'snapcraft':
        init_snapcraft(app)
    else:
        init_brandstore(app)

    return app


def init_brandstore(app):
    store_query = app.config.get('WEBAPP_CONFIG').get('STORE_QUERY')
    app.register_blueprint(store_blueprint(store_query))


def init_snapcraft(app):
    app.register_blueprint(snapcraft_blueprint())
    app.register_blueprint(login)
    csrf.exempt('webapp.login.views.login_handler')
    app.register_blueprint(store_blueprint())
    app.register_blueprint(account, url_prefix='/account')
    app.register_blueprint(publisher_snaps, url_prefix='/account/snaps')

    if app.config['BLOG_ENABLED']:
        app.register_blueprint(blog, url_prefix='/blog')


def init_extensions(app):
    csrf.init_app(app)
    sentry.init_app(app)
