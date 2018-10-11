import flask

first_snap = flask.Blueprint(
    "fist_snap_flow",
    __name__,
    template_folder="/templates",
    static_folder="/static",
)


@first_snap.route("/")
def get_first_snap():
    return "first snap"


@first_snap.route("/<language>")
def get_language(language):
    return language


@first_snap.route("/<language>/<os>")
def get_os(language, os):
    return language + os


@first_snap.route("/<language>/<os>/test")
def get_test(language, os):
    return language + os + "test"


@first_snap.route("/<language>/<os>/push")
def get_push(language, os):
    return language + os + "push"


@first_snap.route("/<language>/<os>/package")
def get_package(language, os):
    return language + os + "package"


@first_snap.route("/<language>/<os>/build")
def get_build(language, os):
    return language + os + "build"
