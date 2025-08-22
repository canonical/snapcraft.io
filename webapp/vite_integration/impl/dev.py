from typing import List
from urllib.parse import urljoin

from webapp.vite_integration.impl.base import _AbstractViteIntegration


class DevViteIntegration(_AbstractViteIntegration):
    def __init__(self):
        self.baseurl = "http://localhost:5173/"  # TODO: update if port changes

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
