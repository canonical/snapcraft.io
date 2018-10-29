import os
import flask
from ruamel.yaml import YAML

from webapp.first_snap import logic

yaml = YAML(typ="safe")

first_snap = flask.Blueprint(
    "fist_snap_flow",
    __name__,
    template_folder="/templates",
    static_folder="/static",
)


def get_file(file):
    try:
        with open(
            os.path.join(flask.current_app.root_path, file), "r"
        ) as stream:
            data = yaml.load(stream)
    except Exception:
        data = None

    return data


def directory_exists(file):
    return os.path.isdir(os.path.join(flask.current_app.root_path, file))


@first_snap.route("/")
def get_pick_language():
    return flask.render_template("first-snap/language.html")


@first_snap.route("/<language>")
def get_language(language):
    filename = f"first-snap/{language}"
    if not directory_exists(filename):
        return flask.abort(404)

    context = {"language": language}
    return flask.render_template(
        "first-snap/install-snapcraft.html", **context
    )


@first_snap.route("/<language>/<operating_system>/package")
def get_package(language, operating_system):
    filename = f"first-snap/{language}/package.yaml"
    steps = get_file(filename)

    if not steps:
        return flask.abort(404)

    context = {"language": language, "os": operating_system, "steps": steps}

    return flask.render_template("first-snap/package.html", **context)


@first_snap.route("/<language>/<operating_system>/build")
def get_build(language, operating_system):
    filename = f"first-snap/{language}/build.yaml"
    steps = get_file(filename)

    operating_system_parts = operating_system.split("-")

    operating_system_only = operating_system_parts[0]
    install_type = (
        operating_system_parts[1]
        if len(operating_system_parts) == 2
        else "auto"
    )

    if (
        (not steps)
        or (operating_system_only not in steps)
        or (install_type not in steps[operating_system_only])
    ):
        return flask.abort(404)

    context = {
        "language": language,
        "os": operating_system,
        "steps": steps[operating_system_only][install_type],
    }

    return flask.render_template("first-snap/build.html", **context)


@first_snap.route("/<language>/<operating_system>/test")
def get_test(language, operating_system):
    filename = f"first-snap/{language}/test.yaml"
    steps = get_file(filename)

    operating_system_only = operating_system.split("-")[0]

    if not steps or operating_system_only not in steps:
        return flask.abort(404)

    converted_steps = []

    for step in steps[operating_system_only]:
        action = logic.convert_md(step["action"])
        converted_steps.append(
            {
                "action": action,
                "command": step["command"] if "command" in step else None,
            }
        )

    context = {
        "language": language,
        "os": operating_system,
        "steps": converted_steps,
    }

    return flask.render_template("first-snap/test.html", **context)


@first_snap.route("/<language>/<operating_system>/push")
def get_push(language, operating_system):
    filename = f"first-snap/{language}/package.yaml"
    data = get_file(filename)

    if not data:
        return flask.abort(404)

    flask_user = flask.session.get("openid", {})

    if "nickname" in flask_user:
        user = {
            "image": flask_user["image"],
            "username": flask_user["nickname"],
            "display_name": flask_user["fullname"],
            "email": flask_user["email"],
        }
    else:
        user = None

    context = {
        "language": language,
        "os": operating_system,
        "user": user,
        "snap_name": data["name"],
    }

    return flask.render_template("first-snap/push.html", **context)
