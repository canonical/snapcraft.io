from os import path
import json
from typing import List, Set
from functools import cache

from ..utils import EXTENSION_NAME
from ..types import Config, Manifest, ManifestChunk
from .base import _AbstractViteIntegration
from ..exceptions import (
    AssetPathException,
    ManifestContentException,
    ManifestPathException,
)


class ProdViteIntegration(_AbstractViteIntegration):
    BUILD_MANIFEST = ".vite/manifest.json"
    manifest = None  # we cache the manifest contents in a static attribute

    def __init__(self, config: Config):
        self.outdir = config["outdir"]

        if ProdViteIntegration.manifest:
            # manifest has already been parsed
            return

        # print("Initializing Vite manifest")
        manifest_path = path.join(
            self.outdir, ProdViteIntegration.BUILD_MANIFEST
        )
        if not path.isfile(manifest_path):
            raise ManifestPathException(
                f"{EXTENSION_NAME}: Bad path to Vite manifest"
            )

        manifest: Manifest = {}
        with open(manifest_path) as f:
            manifest = json.load(f)
        ProdViteIntegration.manifest = manifest

    def get_dev_tools(self) -> str:
        return ""

    @cache
    def get_asset_url(self, asset_name: str) -> str:
        entry = ProdViteIntegration.manifest.get(asset_name)
        if not entry:
            raise ManifestContentException(
                f'{EXTENSION_NAME}: Asset "{asset_name}" not declared in Vite'
                " build manifest"
            )

        entry_path = path.join(self.outdir, entry["file"])
        if not path.isfile(entry_path):
            raise AssetPathException(
                f'{EXTENSION_NAME}: Path to asset file "{entry_path}" '
                "doesn't exist; check your VITE_OUTDIR env variable"
            )

        return f"/{entry_path}"

    @cache
    def _recursive_get_chunks(self, asset_name: str) -> List[ManifestChunk]:
        seen: Set[str] = set()

        # recursively visit the manifest to build the import tree for the
        # given `asset_name`
        def __recursive_get_chunks(
            chunk: ManifestChunk,
        ) -> List[ManifestChunk]:
            chunks: List[ManifestChunk] = []
            for file in chunk.get("imports", []):
                importee = ProdViteIntegration.manifest[file]
                if file in seen:
                    continue
                seen.add(file)
                chunks.extend(__recursive_get_chunks(importee))
                chunks.append(importee)
            return chunks

        entry = ProdViteIntegration.manifest.get(asset_name)
        if not entry:
            raise ManifestContentException(
                f'{EXTENSION_NAME}: Asset "{asset_name}" not declared in '
                "Vite build manifest"
            )

        return [entry] + __recursive_get_chunks(entry)

    @cache
    def get_imported_chunks(self, asset_name: str) -> List[str]:
        chunks = self._recursive_get_chunks(asset_name)
        files = [
            path.join(self.outdir, chunk["file"])
            for chunk in chunks[1:]  # first chunk is `asset_name``
        ]

        for f in files:
            if not path.isfile(f):
                raise AssetPathException(
                    f'{EXTENSION_NAME}: Path to asset file "{f}" doesn\'t '
                    "exist; check your VITE_OUTDIR env variable"
                )

        # only build filesystem paths for all chunks
        urls = [f"/{f}" for f in files]

        return urls

    @cache
    def get_imported_css(self, asset_name: str) -> List[str]:
        chunks = self._recursive_get_chunks(asset_name)
        files = []
        for chunk in chunks:
            for file in chunk.get("css", []):
                files.append(path.join(self.outdir, file))

        for f in files:
            if not path.isfile(f):
                raise AssetPathException(
                    f'{EXTENSION_NAME}: Path to asset file "{f}" doesn\'t '
                    "exist; check your VITE_OUTDIR env variable"
                )

        # only build filesystem paths for all chunks
        urls = [f"/{f}" for f in files]

        return urls
