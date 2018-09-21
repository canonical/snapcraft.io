"""
A Flask application for snapcraft.io.

The web frontend for the snap store.
"""

import flask
from werkzeug.contrib.fixers import ProxyFix
from werkzeug.debug import DebuggedApplication

import prometheus_flask_exporter
import talisker.flask
import webapp.helpers as helpers
from webapp.blog.views import blog
from webapp.extensions import csrf
from webapp.handlers import set_handlers
from webapp.login.views import login
from webapp.publisher.snaps.views import publisher_snaps
from webapp.publisher.views import account
from webapp.snapcraft.views import snapcraft_blueprint
from webapp.store.views import store_blueprint


def create_app(testing=False):
    app = flask.Flask(
        __name__, template_folder="../templates", static_folder="../static"
    )

    app.config.from_object("webapp.config")
    app.testing = testing

    app.wsgi_app = ProxyFix(app.wsgi_app)
    if app.debug:
        app.wsgi_app = DebuggedApplication(app.wsgi_app)

    app.url_map.strict_slashes = False
    app.url_map.converters["regex"] = helpers.RegexConverter

    if not testing:
        talisker.flask.register(app)

        prometheus_flask_exporter.PrometheusMetrics(
            app,
            group_by_endpoint=True,
            buckets=[0.25, 0.5, 0.75, 1, 2],
            path=None,
        )

        init_extensions(app)

    app.config.from_object("webapp.configs." + app.config["WEBAPP"])

    set_handlers(app)

    if app.config["WEBAPP"] == "snapcraft":
        init_snapcraft(app)
    else:
        init_brandstore(app)

    return app


def init_brandstore(app):
    store = app.config.get("WEBAPP_CONFIG").get("STORE_QUERY")
    displayed_snaps = app.config.get("WEBAPP_CONFIG").get(
        "DISPLAYED_SNAPS_HOMEPAGE"
    )
    app.register_blueprint(store_blueprint(store, displayed_snaps))


def init_snapcraft(app):
    app.register_blueprint(snapcraft_blueprint())
    app.register_blueprint(login)
    csrf.exempt("webapp.login.views.login_handler")
    app.register_blueprint(store_blueprint())
    app.register_blueprint(account, url_prefix="/account")
    app.register_blueprint(publisher_snaps)
    app.register_blueprint(blog, url_prefix="/blog")


def init_extensions(app):
    csrf.init_app(app)
