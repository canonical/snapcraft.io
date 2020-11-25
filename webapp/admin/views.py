# Packages
import flask

# Local
from webapp.decorators import login_required

admin = flask.Blueprint(
    "admin", __name__, template_folder="/templates", static_folder="/static"
)


@admin.route("/admin")
@login_required
def get_stores():

    return flask.render_template("admin/admin.html", store_id="store-a1")


@admin.route("/admin/<store_id>")
@login_required
def get_store(store_id):

    return flask.render_template("admin/admin.html", store_id=store_id)
