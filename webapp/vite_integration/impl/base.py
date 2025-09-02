from abc import abstractmethod
from typing import List


class _AbstractViteIntegration:
    @abstractmethod
    def __init__(self):
        pass

    @abstractmethod
    def get_dev_tools(self) -> str:
        pass

    @abstractmethod
    def get_asset_url(self, asset_name: str) -> str:
        pass

    @abstractmethod
    def get_imported_chunks(self, asset_name: str) -> List[str]:
        pass
