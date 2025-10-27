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
    # we cache the manifest contents in a static attribute
    manifest: Manifest = None

    def __init__(self, config: Config):
        self.outdir = config["outdir"]

        if ProdViteIntegration.manifest:
            # manifest has already been parsed
            return

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

    @cache
    def get_asset_url(self, asset_name: str) -> str:
        asset = self._get_asset(asset_name)

        asset_path = path.join(self.outdir, asset["file"])
        self._check_file_exists(asset_path)

        return f"/{asset_path}"

    @cache
    def get_imported_chunks(self, asset_name: str) -> List[str]:
        chunks = self._recursive_get_chunks(asset_name)
        files = [
            path.join(self.outdir, chunk["file"])
            for chunk in chunks[1:]  # first chunk is `asset_name`
        ]

        self._check_all_files_exist(files)

        # build URLs for all chunks
        urls = [f"/{f}" for f in files]

        return urls

    @cache
    def get_imported_css(self, asset_name: str) -> List[str]:
        chunks = self._recursive_get_chunks(asset_name)
        files = []
        for chunk in chunks:
            for file in chunk.get("css", []):
                files.append(path.join(self.outdir, file))

        self._check_all_files_exist(files)

        # build URLs for all stylesheets
        urls = [f"/{f}" for f in files]

        return urls

    def _get_asset(self, asset_name: str) -> ManifestChunk:
        asset_chunk = ProdViteIntegration.manifest.get(asset_name)
        if not asset_chunk:
            raise ManifestContentException(
                f'{EXTENSION_NAME}: Asset "{asset_name}" not declared in '
                "Vite build manifest"
            )
        return asset_chunk

    def _check_file_exists(self, file: str):
        if not path.isfile(file):
            raise AssetPathException(
                f'{EXTENSION_NAME}: Path to asset file "{file}" doesn\'t '
                "exist; check your VITE_OUTDIR env variable"
            )

    def _check_all_files_exist(self, files: List[str]):
        for f in files:
            self._check_file_exists(f)

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

        asset = self._get_asset(asset_name)

        return [asset] + __recursive_get_chunks(asset)
