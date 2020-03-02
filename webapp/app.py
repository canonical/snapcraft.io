"""
A Flask application for snapcraft.io.

The web frontend for the snap store.
"""

import talisker.requests
import webapp.api
from canonicalwebteam.flask_base.app import FlaskBase
from webapp.blog.views import init_blog
from webapp.docs.views import init_docs
from webapp.extensions import csrf
from webapp.first_snap.views import first_snap
from webapp.handlers import set_handlers
from webapp.login.views import login
from webapp.publisher.snaps.views import publisher_snaps
from webapp.publisher.views import account
from webapp.snapcraft.views import snapcraft_blueprint
from webapp.store.views import store_blueprint
from webapp.tutorials.views import init_tutorials


def create_app(testing=False):
    app = FlaskBase(
        __name__,
        "snapcraft.io",
        favicon_url="https://assets.ubuntu.com/v1/fdc99abe-ico_16px.png",
        template_404="404.html",
        template_folder="../templates",
        static_folder="../static",
    )
    app.config.from_object("webapp.config")
    app.testing = testing

    if not testing:
        init_extensions(app)
        talisker.requests.configure(webapp.api.dashboard.api_session)
        talisker.requests.configure(webapp.api.sso.api_session)

    app.config.from_object("webapp.configs." + app.config["WEBAPP"])
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
    init_docs(app, "/docs")
    init_blog(app, "/blog")
    init_tutorials(app, "/tutorials")


def init_extensions(app):
    csrf.init_app(app)
