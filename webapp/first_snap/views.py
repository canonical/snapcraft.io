import os
import re
from io import StringIO

from webapp import helpers
from webapp.first_snap import logic

YAML_KEY_REGEXP = re.compile(r"([^\s:]*)(:.*)")


first_snap = flask.Blueprint(
    "fist_snap_flow",
    __name__,
    template_folder="/templates",
    static_folder="/static",
)


def transform_snapcraft_yaml(snapcraft_yaml):
    """
    Transforms a snapcraft.yaml dict top-level key
    values into renderable HTML.

    Keyword arguments:
    snapcraft_yaml -- content of a snapcraft.yaml file
    """
    for key in snapcraft_yaml:
        stream = StringIO()
        data = {}
        data[key] = snapcraft_yaml[key]
        helpers.dump_yaml(data, stream, typ="rt")
        stream = stream.getvalue()

        # Assuming content starts with yaml key name, wrap it in <b>
        # for some code highligthing in HTML
        content = re.sub(YAML_KEY_REGEXP, r"<b>\1</b>\2", stream)
        snapcraft_yaml[key] = content

    return snapcraft_yaml


def directory_exists(file):
    return os.path.isdir(os.path.join(flask.current_app.root_path, file))


@first_snap.route("/")
def get_pick_language():
    return flask.render_template("first-snap/language.html")


@first_snap.route("/<language>")
def get_language(language):
    filename = f"first_snap/content/{language}"
    if not directory_exists(filename):
        return flask.abort(404)

    context = {"language": language}
    return flask.render_template(
        "first-snap/install-snapcraft.html", **context
    )


@first_snap.route("/<language>/snapcraft.yaml")
def get_language_snapcraft_yaml(language):
    filename = f"first_snap/content/{language}/package.yaml"
    snapcraft_yaml_filename = f"first_snap/content/{language}/snapcraft.yaml"
    snap_name_cookie = f"fsf_snap_name_{language}"
    steps = helpers.get_yaml(filename, typ="rt")

    if not steps:
        return flask.abort(404)

    snap_name = steps["name"]

    if snap_name_cookie in flask.request.cookies:
        snap_name = flask.request.cookies.get(snap_name_cookie)

    snapcraft_yaml = helpers.get_file(
        snapcraft_yaml_filename, {"${name}": snap_name}
    )

    if not snapcraft_yaml:
        return flask.abort(404)

    return flask.Response(
        snapcraft_yaml,
        mimetype="text/yaml",
        headers={"Content-Disposition": "attachment;filename=snaprcaft.yaml"},
    )


@first_snap.route("/<language>/<operating_system>/package")
def get_package(language, operating_system):
    filename = f"first_snap/content/{language}/package.yaml"
    snapcraft_yaml_filename = f"first_snap/content/{language}/snapcraft.yaml"
    annotations_filename = "first_snap/content/snapcraft_yaml_annotations.yaml"

    snap_name_cookie = f"fsf_snap_name_{language}"
    steps = helpers.get_yaml(filename, typ="rt")

    if not steps:
        return flask.abort(404)

    snap_name = steps["name"]
    has_user_chosen_name = False

    if flask.session.get("openid"):
        user_name = flask.session["openid"]["nickname"]
        snap_name = snap_name.replace("{name}", user_name)

    if snap_name_cookie in flask.request.cookies:
        snap_name = flask.request.cookies.get(snap_name_cookie)
        has_user_chosen_name = True

    context = {
        "language": language,
        "os": operating_system,
        "steps": steps,
        "snap_name": snap_name,
        "has_user_chosen_name": has_user_chosen_name,
    }

    snapcraft_yaml = helpers.get_yaml(
        snapcraft_yaml_filename, typ="rt", replaces={"${name}": snap_name}
    )
    annotations = helpers.get_yaml(annotations_filename, typ="rt")

    if snapcraft_yaml:
        context["snapcraft_yaml"] = transform_snapcraft_yaml(snapcraft_yaml)
        context["annotations"] = annotations
        return flask.render_template("first-snap/package.html", **context)
    else:
        return flask.abort(404)


@first_snap.route("/<language>/<operating_system>/build")
def get_build(language, operating_system):
    filename = f"first_snap/content/{language}/build.yaml"
    snap_name_cookie = f"fsf_snap_name_{language}"
    steps = helpers.get_yaml(filename, typ="rt")
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

    snap_name = steps["name"]

    if flask.session.get("openid"):
        user_name = flask.session["openid"]["nickname"]
        snap_name = snap_name.replace("{name}", user_name)

    if snap_name_cookie in flask.request.cookies:
        snap_name = flask.request.cookies.get(snap_name_cookie)

    context = {
        "language": language,
        "os": operating_system,
        "steps": steps[operating_system_only][install_type],
        "snap_name": snap_name,
    }

    return flask.render_template("first-snap/build.html", **context)


@first_snap.route("/<language>/<operating_system>/test")
def get_test(language, operating_system):
    filename = f"first_snap/content/{language}/test.yaml"
    snap_name_cookie = f"fsf_snap_name_{language}"
    steps = helpers.get_yaml(filename, typ="rt")

    operating_system_only = operating_system.split("-")[0]

    if not steps or operating_system_only not in steps:
        return flask.abort(404)

    snap_name = steps["name"]

    if flask.session.get("openid"):
        user_name = flask.session["openid"]["nickname"]
        snap_name = snap_name.replace("{name}", user_name)

    if snap_name_cookie in flask.request.cookies:
        snap_name = flask.request.cookies.get(snap_name_cookie)

    converted_steps = []

    for step in steps[operating_system_only]:
        action = logic.convert_md(step["action"])
        converted_steps.append(
            {
                "action": action,
                "warning": step["warning"] if "warning" in step else None,
                "command": step["command"] if "command" in step else None,
            }
        )

    context = {
        "language": language,
        "os": operating_system,
        "steps": converted_steps,
        "snap_name": snap_name,
    }

    return flask.render_template("first-snap/test.html", **context)


@first_snap.route("/<language>/<operating_system>/push")
def get_push(language, operating_system):
    filename = f"first_snap/content/{language}/package.yaml"
    snap_name_cookie = f"fsf_snap_name_{language}"

    data = helpers.get_yaml(filename, typ="rt")

    if not data:
        return flask.abort(404)

    snap_name = data["name"]
    has_user_chosen_name = False

    if flask.session.get("openid"):
        user_name = flask.session["openid"]["nickname"]
        snap_name = snap_name.replace("{name}", user_name)

    if snap_name_cookie in flask.request.cookies:
        snap_name = flask.request.cookies.get(snap_name_cookie)
        has_user_chosen_name = True

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
        "snap_name": snap_name,
        "has_user_chosen_name": has_user_chosen_name,
    }

    return flask.render_template("first-snap/push.html", **context)
