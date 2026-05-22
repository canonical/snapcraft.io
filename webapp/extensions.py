import base64
import json
import posixpath
import re
from os import path
from pathlib import Path
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
_IMPORT_META_URL_PATTERN = re.compile(r"\bimport\.meta\.url\b")


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


def _is_local_vite_script(specifier: str) -> bool:
    _, extension = path.splitext(specifier)
    return (
        specifier.startswith("/static/js/dist/vite/")
        and extension in _SCRIPT_EXTENSIONS
    )


def _extract_local_vite_imports(
    module_source: str, module_url: str
) -> list[str]:
    discovered_imports: list[str] = []

    for match in _IMPORT_SPECIFIER_PATTERN.finditer(module_source):
        specifier = match.group("specifier")
        resolved_specifier = _resolve_specifier(module_url, specifier)

        if _is_local_vite_script(resolved_specifier):
            discovered_imports.append(resolved_specifier)

    return discovered_imports


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

    rewritten_source = _IMPORT_SPECIFIER_PATTERN.sub(
        replace_specifier, module_source
    )
    module_absolute_url = urljoin(
        flask.request.url_root, module_url.lstrip("/")
    )
    return _IMPORT_META_URL_PATTERN.sub(
        json.dumps(module_absolute_url), rewritten_source
    )


def _read_asset(url: str) -> str:
    file_path = url.lstrip("/")
    with open(file_path, encoding="utf-8") as asset:
        return asset.read()


def _get_vite_script_module_urls() -> list[str]:
    out_dir = Path(
        flask.current_app.config.get("VITE_OUTDIR", "static/js/dist/vite")
    )
    module_urls = [
        f"/{module_path.as_posix()}"
        for module_path in out_dir.rglob("*.js")
        if module_path.is_file()
    ]
    module_urls.sort()
    return module_urls


def _get_rewritten_inline_modules() -> dict[str, str]:
    cached_modules = getattr(flask.g, "_vite_inline_rewritten_modules", None)
    if cached_modules is not None:
        return cached_modules

    module_urls = _get_vite_script_module_urls()
    known_module_urls = set(module_urls)
    rewritten_modules = {
        module_url: _rewrite_module_specifiers(
            _read_asset(module_url), module_url, known_module_urls
        )
        for module_url in module_urls
    }

    flask.g._vite_inline_rewritten_modules = rewritten_modules
    return rewritten_modules


def _build_import_map_script(
    rewritten_modules: dict[str, str], nonce_attr: str
) -> str:
    import_map = {
        "imports": {
            urljoin(flask.request.url_root, module_url.lstrip("/")): (
                "data:text/javascript;base64,"
                + base64.b64encode(module_code.encode("utf-8")).decode("utf-8")
            )
            for module_url, module_code in rewritten_modules.items()
        }
    }
    import_map_json = json.dumps(import_map, separators=(",", ":"))
    return (
        f'<script type="importmap"{nonce_attr}>'
        f"{_escape_inline_script(import_map_json)}"
        "</script>"
    )


def _inline_script_import(entrypoint: str) -> Markup:
    entry_url = vite.instance.get_asset_url(entrypoint)
    css_urls = vite.instance.get_imported_css(entrypoint)
    rewritten_modules = _get_rewritten_inline_modules()

    nonce_attr = _csp_nonce_attr()
    import_map_script = ""
    if not getattr(flask.g, "_vite_inline_import_map_emitted", False):
        import_map_script = _build_import_map_script(
            rewritten_modules, nonce_attr
        )
        flask.g._vite_inline_import_map_emitted = True

    entry_script = (
        f'<script type="module"{nonce_attr}>'
        f"{_escape_inline_script(rewritten_modules[entry_url])}"
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
