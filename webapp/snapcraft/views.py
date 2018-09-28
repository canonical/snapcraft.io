import flask


def snapcraft_blueprint():
    snapcraft = flask.Blueprint(
        "snapcraft",
        __name__,
        template_folder="/templates",
        static_folder="/static",
    )

    @snapcraft.route("/")
    def homepage():
        nps = flask.request.args.get("nps")

        return flask.render_template("index.html", nps=nps)

    @snapcraft.route("/iot")
    def iot():
        status_code = 200

        return flask.render_template("store/categories/iot.html"), status_code

    @snapcraft.route("/docs", defaults={"path": ""})
    @snapcraft.route("/docs/<path:path>")
    def docs_redirect(path):
        return flask.redirect("https://docs.snapcraft.io/" + path)

    @snapcraft.route("/community")
    def community_redirect():
        return flask.redirect("/")

    @snapcraft.route("/create")
    def create_redirect():
        return flask.redirect("https://docs.snapcraft.io/build-snaps")

    @snapcraft.route("/favicon.ico")
    def favicon():
        return flask.redirect(
            "https://assets.ubuntu.com/v1/fdc99abe-ico_16px.png"
        )

    @snapcraft.route("/build")
    def build():
        status_code = 200

        return flask.render_template("snapcraft/build.html"), status_code

    @snapcraft.route("/robots.txt")
    def robots():
        return flask.Response("", mimetype="text/plain")

    return snapcraft
