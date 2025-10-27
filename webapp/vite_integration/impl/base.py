from abc import abstractmethod
from typing import List

from ..types import Config


class _AbstractViteIntegration:
    @abstractmethod
    def __init__(self, config: Config):
        pass

    @abstractmethod
    def get_asset_url(self, asset_name: str) -> str:
        pass

    @abstractmethod
    def get_imported_chunks(self, asset_name: str) -> List[str]:
        pass

    @abstractmethod
    def get_imported_css(self, asset_name: str) -> List[str]:
        pass
