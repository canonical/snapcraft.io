import flask


builder = flask.Blueprint(
    "builder", __name__, template_folder="/templates", static_folder="/static"
)


@builder.route("/")
def index():
    return flask.render_template("builder/index.html"), 200
