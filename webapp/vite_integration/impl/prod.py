from os import path
import json
from typing import List, Set
from functools import cache

from webapp.config import VITE_OUTPUT_DIR
from webapp.vite_integration.impl.base import _AbstractViteIntegration
from webapp.vite_integration.types import Manifest, ManifestChunk
from webapp.vite_integration.exceptions import (
    AssetPathException,
    ManifestContentException,
    ManifestPathException,
)


class ProdViteIntegration(_AbstractViteIntegration):
    OUT_DIR = VITE_OUTPUT_DIR
    BUILD_MANIFEST = ".vite/manifest.json"
    manifest = None  # we cache the manifest contents in a static attribute

    def __init__(self):
        if ProdViteIntegration.manifest:
            # manifest has already been parsed
            return

        # print("Initializing Vite manifest")
        manifest_path = path.join(
            ProdViteIntegration.OUT_DIR, ProdViteIntegration.BUILD_MANIFEST
        )
        if not path.isfile(manifest_path):
            raise ManifestPathException("Bad path to Vite manifest")

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
                f'Asset "{asset_name}" not declared in Vite build manifest'
            )

        entry_path = path.join(ProdViteIntegration.OUT_DIR, entry["file"])
        if not path.isfile(entry_path):
            # TODO: this should never happen, if the file is there in the
            # manifest then it MUST exist
            raise AssetPathException(
                f'Path to asset file "{entry_path}" doesn\'t exist'
            )

        return f"/{entry_path}"

    @cache
    def get_imported_chunks(self, asset_name: str) -> List[str]:
        seen: Set[str] = set()

        # recursively visit the manifest to build the import tree for the
        # given `asset_name`
        def _get_imported_chunks(chunk: ManifestChunk) -> List[ManifestChunk]:
            chunks: List[ManifestChunk] = []
            for file in chunk.get("imports", []):
                importee = ProdViteIntegration.manifest[file]
                if file in seen:
                    continue
                seen.add(file)
                chunks.extend(_get_imported_chunks(importee))
                chunks.append(importee)
            return chunks

        entry = ProdViteIntegration.manifest.get(asset_name)
        if not entry:
            raise ManifestContentException(
                f'Asset "{asset_name}" not declared in Vite build manifest'
            )

        chunks = _get_imported_chunks(entry)
        files = [
            path.join(ProdViteIntegration.OUT_DIR, f["file"]) for f in chunks
        ]

        for f in files:
            if not path.isfile(f):
                # TODO: this should never happen, if the file is there in the
                # manifest then it MUST exist
                raise AssetPathException(
                    f'Path to asset file "{f}" doesn\'t exist'
                )

        # only build filesystem paths for all chunks
        urls = [f"/{f}" for f in files]

        return urls
