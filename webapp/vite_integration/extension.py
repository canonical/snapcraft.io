import flask
from markupsafe import Markup
from os import path

from .utils import EXTENSION_NAME, staticproperty
from .exceptions import ExtensionNotInitialized
from .impl import (
    DevViteIntegration,
    ProdViteIntegration,
)


class FlaskVite:
    """
    Flask extension that implements the Vite integration
    """

    def __init__(self, app: flask.Flask | None = None):
        if app:
            self.init_app(app)

    @staticproperty
    def instance():
        try:
            return flask.current_app.extensions[EXTENSION_NAME]
        except KeyError:
            raise ExtensionNotInitialized(
                f"{EXTENSION_NAME}: can't use extension before initializing it"
            )

    def init_app(self, app: flask.Flask):
        is_dev = "development" == app.config.get("VITE_MODE", "production")
        ViteIntegration = DevViteIntegration if is_dev else ProdViteIntegration
        config = {
            "port": app.config.get("VITE_PORT", "5173"),
            "outdir": app.config.get("VITE_OUTDIR", "static/dist"),
        }

        if not app.extensions.get(EXTENSION_NAME):
            app.extensions[EXTENSION_NAME] = ViteIntegration(config)

        app.template_global("vite_import")(vite_import)
        app.template_global("vite_dev_tools")(vite_dev_tools)


def vite_import(entrypoint: str):
    """
    Template function that takes a source file as an argument and returns
    the <script> or <link rel="stylesheet"> tags with the correct src URL
    based on Vite's config (a localhost URL in dev mode, or a static path
    in prod mode).
    If the file extension doesn't fall in one of these cases, the function
    will log an error and return an HTML comment, so the import will
    effectively fail silently.
    """
    _, ext = path.splitext(entrypoint)

    match ext:
        case ".css" | ".scss" | ".sass":
            return _stylesheet_import(entrypoint)
        case ".js" | ".ts" | ".jsx" | ".tsx" | ".svelte":
            return _script_import(entrypoint)
        case _:
            return _unknown_import(entrypoint)


def vite_dev_tools():
    """
    Template function that returns <script> tags for Vite's dev server
    integration (or an empty string in prod mode)
    """
    return Markup(flask.current_app.extensions[EXTENSION_NAME].get_dev_tools())


def _stylesheet_import(entrypoint):
    entry_url = FlaskVite.instance.get_asset_url(entrypoint)
    return Markup(f'<link rel="stylesheet" href="{entry_url}" />')


def _script_import(entrypoint):
    entry_url = FlaskVite.instance.get_asset_url(entrypoint)

    entry_script = [f'<script type="module" src="{entry_url}"></script>']

    # a script might import stylesheets, which are treated as a dependency
    css_urls = FlaskVite.instance.get_imported_css(entrypoint)
    css_scripts = [f'<link rel="stylesheet" href="{c}" />' for c in css_urls]

    # build the dependency tree of the imported script, so dependencies from
    # other modules can be fetched early, using `modulepreload` hints
    chunks_urls = FlaskVite.instance.get_imported_chunks(entrypoint)
    chunks_scripts = [
        f'<link rel="modulepreload" href="{c}" />' for c in chunks_urls
    ]

    return Markup("".join(entry_script + chunks_scripts + css_scripts))


def _unknown_import(entrypoint):
    flask.current_app.logger.error(
        f'{EXTENSION_NAME}: can\'t import file "{entrypoint}" with'
        " unknown file extension"
    )
    return Markup(
        "<!--"
        f"{EXTENSION_NAME}: unknown file extension for file {entrypoint} "
        "-->"
    )
