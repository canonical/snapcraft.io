from typing import List
from urllib.parse import urljoin

from ..types import Config
from .base import _AbstractViteIntegration


class DevViteIntegration(_AbstractViteIntegration):
    def __init__(self, config: Config):
        self.baseurl = f'http://localhost:{config["port"]}/'

    def get_dev_tools(self) -> str:
        # Vite dev server integration needs 2 things:
        # 1. the Vite client code for hot reload
        # 2. the @react-refresh preamble
        return (
            ""
            "<script"
            '  type="module" '
            f' src="{urljoin(self.baseurl, "@vite/client")}">'
            "</script>"
            '<script type="module">'
            "  import RefreshRuntime from "
            f'       "{urljoin(self.baseurl, "@react-refresh")}";'
            "  RefreshRuntime.injectIntoGlobalHook(window);"
            "  window.$RefreshReg$ = () => {};"
            "  window.$RefreshSig$ = () => (type) => type;"
            "  window.__vite_plugin_react_preamble_installed__ = true;"
            "</script>"
        )

    def get_asset_url(self, asset_name: str) -> str:
        # only return the requested entry point, Vite dev server will take
        # care of the rest
        return urljoin(self.baseurl, asset_name)

    def get_imported_chunks(self, asset_name: str) -> List[str]:
        # no need for this, Vite dev server imports automatically
        return []

    def get_imported_css(self, asset_name: str) -> List[str]:
        # no need for this, Vite dev server imports automatically
        return []
