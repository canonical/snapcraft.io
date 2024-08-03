"""
A Flask application for snapcraft.io.

The web frontend for the snap store.
"""

import talisker.requests
import webapp.api

from talisker import logging

from canonicalwebteam.flask_base.app import FlaskBase
from webapp.blog.views import init_blog
from webapp.docs.views import init_docs
from webapp.extensions import csrf
from webapp.first_snap.views import first_snap
from webapp.handlers import set_handlers
from webapp.login.views import login
from webapp.login.oauth_views import oauth
from webapp.publisher.snaps.views import publisher_snaps
from webapp.publisher.github.views import publisher_github
from webapp.admin.views import admin
from webapp.publisher.views import account
from webapp.snapcraft.views import snapcraft_blueprint
from webapp.store.views import store_blueprint
from webapp.tutorials.views import init_tutorials
from webapp.admin_dashboard.views import admin_dashboard


TALISKER_WSGI_LOGGER = logging.getLogger("talisker.wsgi")


def create_app(testing=False):
    app = FlaskBase(
        __name__,
        "snapcraft.io",
        favicon_url="https://assets.ubuntu.com/v1/d4ca039f-favicon_16px.png",
        template_404="404.html",
        template_folder="../templates",
        static_folder="../static",
    )
    app.config.from_object("webapp.config")
    app.testing = testing

    if not testing:
        init_extensions(app)
        talisker.requests.configure(webapp.api.sso.api_session)
        talisker.requests.configure(webapp.helpers.api_session)
        talisker.requests.configure(webapp.helpers.api_publisher_session)

    set_handlers(app)

    app.register_blueprint(snapcraft_blueprint())
    app.register_blueprint(first_snap, url_prefix="/first-snap")
    app.register_blueprint(login)
    app.register_blueprint(oauth)
    app.register_blueprint(store_blueprint())
    app.register_blueprint(account, url_prefix="/account")
    app.register_blueprint(publisher_snaps)
    app.register_blueprint(publisher_github)
    app.register_blueprint(admin)
    app.register_blueprint(admin_dashboard, url_prefix="/admin-dashboard")
    init_docs(app, "/docs")
    init_blog(app, "/blog")
    init_tutorials(app, "/tutorials")

    return app


def init_extensions(app):
    csrf.init_app(app)
