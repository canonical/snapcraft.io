import flask
from markupsafe import Markup
from os import path
from urllib.parse import urljoin
from typing import Union

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
    def instance() -> Union[DevViteIntegration, ProdViteIntegration]:
        try:
            return flask.current_app.extensions[EXTENSION_NAME]
        except KeyError:
            raise ExtensionNotInitialized(
                f"{EXTENSION_NAME}: can't use extension before initializing it"
            )

    def init_app(self, app: flask.Flask):
        config = {
            "mode": app.config.get("VITE_MODE", "production"),
            "port": app.config.get("VITE_PORT", 5173),
            "outdir": app.config.get("VITE_OUTDIR", "static/dist"),
        }
        is_dev = "development" == config["mode"]
        ViteIntegration = DevViteIntegration if is_dev else ProdViteIntegration

        if not app.extensions.get(EXTENSION_NAME):
            app.extensions[EXTENSION_NAME] = ViteIntegration(config)

        app.template_global("vite_import")(vite_import)

        if is_dev:
            # add an after request handler to inject dev tools scripts
            app.after_request(_inject_vite_dev_tools)


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
        case ".css" | ".scss" | ".sass" | ".less" | ".styl":
            return _stylesheet_import(entrypoint)
        case ".js" | ".ts" | ".jsx" | ".tsx" | ".svelte" | ".vue":
            return _script_import(entrypoint)
        case _:
            return _unknown_import(entrypoint)


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


def _inject_vite_dev_tools(res: flask.Response):
    """
    Patch text/html responses by injecting the <script> tags for Vite's dev
    server tools before closing the <head> tag
    """
    if "text/html" not in res.mimetype:
        # response is not an HTML page, no need for Vite scripts
        return res

    body = res.get_data(as_text=True)
    if not body:
        # response doesn't have a body, no need for Vite scripts
        return res

    # build the dev tools scripts string
    port = flask.current_app.config.get("VITE_PORT", 5173)
    baseurl = f"http://localhost:{port}/"
    dev_tools = f"""
    <!-- {EXTENSION_NAME}: start Vite dev tools -->
    <script
        type="module"
        src="{urljoin(baseurl, "@vite/client")}">
    </script>
    <script type="module">
        import RefreshRuntime from "{urljoin(baseurl, "@react-refresh")}";
        RefreshRuntime.injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {{}};
        window.$RefreshSig$ = () => (type) => type;
        window.__vite_plugin_react_preamble_installed__ = true;
    </script>
    <!-- {EXTENSION_NAME}: end Vite dev tools -->
    """

    # inject the dev tools' scripts at the end of the <head> tag
    body = body.replace("</head>", f"{dev_tools}\n</head>")
    res.set_data(body)
    return res
