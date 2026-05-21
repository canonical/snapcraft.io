import base64
import json
import posixpath
import re
from os import path
from urllib.parse import urljoin

import flask
from canonicalwebteam.flask_vite import FlaskVite
from canonicalwebteam.flask_vite.extension import (
    vite_import as flask_vite_import,
)
from flask_wtf.csrf import CSRFProtect
from markupsafe import Markup

csrf = CSRFProtect()
vite = FlaskVite()

_SCRIPT_EXTENSIONS = {".js", ".ts", ".jsx", ".tsx", ".svelte", ".vue"}
_IMPORT_SPECIFIER_PATTERN = re.compile(
    r'(?P<prefix>\bfrom\s*["\']|\bimport\s*["\']|\bimport\s*\(\s*["\'])'
    r'(?P<specifier>[^"\']+)'
    r'(?P<suffix>["\'])'
)


def _csp_nonce_attr() -> str:
    nonce = getattr(flask.request, "CSP_NONCE", "")
    if not nonce:
        return ""
    return f' nonce="{nonce}"'


def _escape_inline_script(content: str) -> str:
    return content.replace("</script", "<\\/script")


def _resolve_specifier(module_url: str, specifier: str) -> str:
    if specifier.startswith("/"):
        return posixpath.normpath(specifier)

    if specifier.startswith("."):
        module_dir = posixpath.dirname(module_url)
        return posixpath.normpath(posixpath.join(module_dir, specifier))

    return specifier


def _rewrite_module_specifiers(
    module_source: str, module_url: str, known_module_urls: set[str]
) -> str:
    def to_absolute_url(specifier_path: str) -> str:
        return urljoin(flask.request.url_root, specifier_path.lstrip("/"))

    def replace_specifier(match: re.Match) -> str:
        specifier = match.group("specifier")
        resolved_specifier = _resolve_specifier(module_url, specifier)

        if resolved_specifier in known_module_urls:
            absolute_url = to_absolute_url(resolved_specifier)
            return (
                f"{match.group('prefix')}{absolute_url}"
                f"{match.group('suffix')}"
            )

        if specifier.startswith("/") or specifier.startswith("."):
            absolute_url = to_absolute_url(resolved_specifier)
            return (
                f"{match.group('prefix')}{absolute_url}"
                f"{match.group('suffix')}"
            )

        return match.group(0)

    return _IMPORT_SPECIFIER_PATTERN.sub(replace_specifier, module_source)


def _read_asset(url: str) -> str:
    file_path = url.lstrip("/")
    with open(file_path, encoding="utf-8") as asset:
        return asset.read()


def _inline_script_import(entrypoint: str) -> Markup:
    entry_url = vite.instance.get_asset_url(entrypoint)
    chunk_urls = vite.instance.get_imported_chunks(entrypoint)
    css_urls = vite.instance.get_imported_css(entrypoint)

    module_urls = [entry_url] + chunk_urls
    known_module_urls = set(module_urls)
    modules: dict[str, str] = {}

    for module_url in module_urls:
        modules[module_url] = _rewrite_module_specifiers(
            _read_asset(module_url), module_url, known_module_urls
        )

    import_map = {
        "imports": {
            urljoin(flask.request.url_root, module_url.lstrip("/")): (
                "data:text/javascript;base64,"
                + base64.b64encode(module_code.encode("utf-8")).decode("utf-8")
            )
            for module_url, module_code in modules.items()
        }
    }

    nonce_attr = _csp_nonce_attr()
    import_map_json = json.dumps(import_map, separators=(",", ":"))
    import_map_script = (
        f'<script type="importmap"{nonce_attr}>'
        f"{_escape_inline_script(import_map_json)}"
        "</script>"
    )
    entry_script = (
        f'<script type="module"{nonce_attr}>'
        f"{_escape_inline_script(modules[entry_url])}"
        "</script>"
    )
    css_links = "".join(
        f'<link rel="stylesheet" href="{css_url}"{nonce_attr} />'
        for css_url in css_urls
    )

    return Markup("".join([import_map_script, entry_script, css_links]))


def vite_import(entrypoint: str) -> Markup:
    _, extension = path.splitext(entrypoint)
    is_inline_script = extension in _SCRIPT_EXTENSIONS
    is_prod = flask.current_app.config.get("VITE_MODE") == "production"
    inline_enabled = flask.current_app.config.get("VITE_INLINE_JS", False)

    if not (is_inline_script and is_prod and inline_enabled):
        return flask_vite_import(entrypoint)

    return _inline_script_import(entrypoint)
