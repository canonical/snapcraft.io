import talisker.requests
from canonicalwebteam.store_api.stores.snapstore import SnapStore
from canonicalwebteam.candid import CandidClient
from canonicalwebteam.store_base.app import create_app
from webapp_beta.snapcraft_bp import snapcraft_bp
import webapp.api
from webapp.handlers import snapcraft_utility_processor
from webapp.extensions import csrf

from webapp.decorators import login_required


app = create_app(
    "snapcraft_beta",
    login_required,
    store_bp=snapcraft_bp,
    utility_processor=snapcraft_utility_processor
)
app.config.from_object("webapp.config")

app.name = "snapcraft_beta"
app.static_folder = snapcraft_bp.static_folder
app.template_folder = snapcraft_bp.template_folder

app.testing = False
csrf.init_app(app)
