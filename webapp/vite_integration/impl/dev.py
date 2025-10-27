from typing import List
from urllib.parse import urljoin

from ..types import Config
from .base import _AbstractViteIntegration


class DevViteIntegration(_AbstractViteIntegration):
    def __init__(self, config: Config):
        self.baseurl = f'http://localhost:{config["port"]}/'

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
