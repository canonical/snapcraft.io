"""
A Flask application for snapcraft.io.

The web frontend for the snap store.
"""

from canonicalwebteam.flask_base.app import FlaskBase
import talisker
import webapp.api
import webapp.helpers as helpers
from canonicalwebteam.yaml_responses.flask_helpers import (
    prepare_deleted,
    prepare_redirects,
)


# from webapp.blog.views import blog
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


app = FlaskBase(
    __name__,
    "snapcraft.io",
    template_folder="../templates",
    static_folder="../static",
    template_404="404.html",
    template_500="500.html",
)

app.config.from_object("webapp.config")

app.url_map.strict_slashes = False
app.url_map.converters["regex"] = helpers.RegexConverter

csrf.init_app(app)

talisker.requests.configure(webapp.api.dashboard.api_session)
talisker.requests.configure(webapp.api.sso.api_session)

app.config.from_object("webapp.configs." + app.config["WEBAPP"])

app.before_request(prepare_redirects())
app.before_request(prepare_deleted())

set_handlers(app)

if app.config["WEBAPP"] == "snapcraft":
    # snapcraft.io
    app.register_blueprint(snapcraft_blueprint())
    app.register_blueprint(first_snap, url_prefix="/first-snap")
    app.register_blueprint(login)
    app.register_blueprint(store_blueprint())
    app.register_blueprint(account, url_prefix="/account")
    app.register_blueprint(publisher_snaps)
    init_docs(app, "/docs")
    init_blog(app, "/blog")
else:
    # Brandstores
    store = app.config.get("WEBAPP_CONFIG").get("STORE_QUERY")
    app.register_blueprint(store_blueprint(store))
