"""
A Flask application for snapcraft.io.

The web frontend for the snap store.
"""

import flask
from werkzeug.contrib.fixers import ProxyFix
from werkzeug.debug import DebuggedApplication

import talisker.flask
import talisker.logs

import webapp.api
import webapp.helpers as helpers
from canonicalwebteam.yaml_responses.flask_helpers import (
    prepare_deleted,
    prepare_redirects,
)
from webapp.blog.views import blog
from webapp.docs.views import init_docs
from webapp.extensions import csrf
from webapp.first_snap.views import first_snap
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
        init_extensions(app)

        talisker.flask.register(app)
        talisker.requests.configure(webapp.api.blog.api_session)
        talisker.requests.configure(webapp.api.dashboard.api_session)
        talisker.requests.configure(webapp.api.sso.api_session)
        talisker.logs.set_global_extra({"service": "snapcraft.io"})

    app.config.from_object("webapp.configs." + app.config["WEBAPP"])

    app.before_request(prepare_redirects())
    app.before_request(prepare_deleted())

    set_handlers(app)

    if app.config["WEBAPP"] == "snapcraft":
        init_snapcraft(app, testing)
    else:
        init_brandstore(app)

    return app


def init_brandstore(app):
    store = app.config.get("WEBAPP_CONFIG").get("STORE_QUERY")
    app.register_blueprint(store_blueprint(store))


def init_snapcraft(app, testing=False):
    app.register_blueprint(snapcraft_blueprint())
    app.register_blueprint(first_snap, url_prefix="/first-snap")
    app.register_blueprint(login)
    app.register_blueprint(store_blueprint(testing=testing))
    app.register_blueprint(account, url_prefix="/account")
    app.register_blueprint(publisher_snaps)
    app.register_blueprint(blog, url_prefix="/blog")
    init_docs(app, "/docs")


def init_extensions(app):
    csrf.init_app(app)
