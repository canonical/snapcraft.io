import os
import json
from typing import List, Set
from abc import abstractmethod
from urllib.parse import urljoin

from webapp.vite_integration.types import Manifest, ManifestChunk
from webapp.vite_integration.exceptions import (
    AssetPathException,
    ManifestContentException,
    ManifestPathException,
)

IS_PROD = os.getenv("ENVIRONMENT", "devel") != "devel"


class _AbstractViteIntegration:
    @abstractmethod
    def __init__(self):
        pass

    @abstractmethod
    def get_asset_url(self, asset_name: str) -> str:
        pass

    @abstractmethod
    def get_imported_chunks(self, asset_name: str) -> List[str]:
        pass


class _DevViteIntegration(_AbstractViteIntegration):
    def __init__(self):
        self.baseurl = "http://localhost:5173/"  # TODO: update if port changes

    def get_asset_url(self, asset_name: str) -> str:
        # only return the requested entry point, Vite dev server will take
        # care of the rest
        return urljoin(self.baseurl, asset_name)

    def get_imported_chunks(self, asset_name: str) -> List[str]:
        # no need for this, Vite dev server imports automatically
        return []


class _ProdViteIntegration(_AbstractViteIntegration):
    OUT_DIR = "static/js/dist/vite"  # TODO: update this when removing webpack
    BUILD_MANIFEST = ".vite/manifest.json"
    manifest = None  # we cache the manifest contents in a static attribute

    def __init__(self):
        if _ProdViteIntegration.manifest:
            # manifest has already been parsed
            return

        print("Initializing Vite manifest")
        manifest_path = os.path.join(
            _ProdViteIntegration.OUT_DIR, _ProdViteIntegration.BUILD_MANIFEST
        )
        if not os.path.isfile(manifest_path):
            raise ManifestPathException("Bad path to Vite manifest")

        manifest: Manifest = {}
        with open(manifest_path) as f:
            manifest = json.load(f)
        _ProdViteIntegration.manifest = manifest

    def get_asset_url(self, asset_name: str) -> str:
        entry = _ProdViteIntegration.manifest[asset_name]
        if not entry:
            raise ManifestContentException(
                f'Asset "{asset_name}" not declared in Vite build manifest'
            )

        entry_path = os.path.join(_ProdViteIntegration.OUT_DIR, entry["file"])
        if not os.path.isfile(entry_path):
            raise AssetPathException(
                f'Path to asset file "{entry_path}" doesn\'t exist'
            )

        return f"/{entry_path}"

    def get_imported_chunks(self, asset_name: str) -> List[str]:
        seen: Set[str] = set()

        # recursively visit the manifest to build the import tree for the
        # given `asset_name`
        def _get_imported_chunks(chunk: ManifestChunk) -> List[ManifestChunk]:
            chunks: List[ManifestChunk] = []
            for file in chunk.get("imports", []):
                importee = _ProdViteIntegration.manifest[file]
                if file in seen:
                    continue
                seen.add(file)
                chunks.extend(_get_imported_chunks(importee))
                chunks.append(importee)
            return chunks

        entry = _ProdViteIntegration.manifest.get(asset_name)
        if not entry:
            raise ManifestContentException(
                f'Asset "{asset_name}" not declared in Vite build manifest'
            )

        chunks = _get_imported_chunks(entry)
        files = [
            os.path.join(_ProdViteIntegration.OUT_DIR, f["file"])
            for f in chunks
        ]

        for f in files:
            if not os.path.isfile(f):
                # TODO: think about whether failing like this would make sense
                # in a prod environment. Probably no, and we'll remove it
                raise AssetPathException(
                    f'Path to asset file "{f}" doesn\'t exist'
                )

        # only build filesystem paths for all chunks
        urls = [f"/{f}" for f in files]

        return urls


ViteIntegration = (_ProdViteIntegration if IS_PROD else _DevViteIntegration)()
