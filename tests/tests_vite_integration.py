from unittest import TestCase
import json
from shutil import rmtree
from typing import cast
from urllib.parse import urlparse
from pathlib import Path
from webapp.vite_integration.impl import (
    ProdViteIntegration,
    DevViteIntegration,
)
import webapp.vite_integration.exceptions as vite_exceptions

MOCK_OUTPUT_PATH = "/tmp/python_vite_test"
MOCK_ASSET_PATH = "test/path/for/asset.ts"
MOCK_SCSS_PATH = "test/path/for/styles.scss"
MOCK_MANIFEST = {
    "_dependency.js": {"file": "chunks/dependency.js", "name": "dependency"},
    "_chunk.js": {
        "file": "chunks/chunk.js",
        "name": "chunk",
        "imports": ["_dependency.js"],
        "css": ["assets/styles.css"],
    },
    "test/path/for/asset.ts": {
        "file": "asset.js",
        "name": "asset",
        "src": "test/path/for/asset.ts",
        "isEntry": True,
        "imports": [
            "_chunk.js",
        ],
    },
    "test/path/for/styles.scss": {
        "file": "assets/styles.css",
        "src": "test/path/for/styles.scss",
        "isEntry": True,
        "names": ["styles.css"],
    },
}


class TestsDevViteIntegration(TestCase):
    def setUp(self):
        self.vite = DevViteIntegration({ "port": "5173" })

    def tests_dev_tools(self):
        dev_tools = self.vite.get_dev_tools()
        assert "@vite/client" in dev_tools
        assert "@react-refresh" in dev_tools

    def tests_get_asset_url(self):
        url = self.vite.get_asset_url(MOCK_ASSET_PATH)
        assert MOCK_ASSET_PATH in url
        parsed = urlparse(url)
        assert parsed.scheme == "http"
        assert parsed.netloc.startswith("localhost:")
        assert parsed.path == f"/{MOCK_ASSET_PATH}"
        assert parsed.params == ""
        assert parsed.query == ""
        assert parsed.fragment == ""

    def tests_get_imported_chunks(self):
        assert len(self.vite.get_imported_chunks(MOCK_ASSET_PATH)) == 0

    def tests_get_imported_css(self):
        assert len(self.vite.get_imported_css(MOCK_ASSET_PATH)) == 0


class TestsProdViteIntegration(TestCase):
    def setUp(self):
        # create a fake Vite output directory
        manifest_path = Path(f"{MOCK_OUTPUT_PATH}/.vite/manifest.json")
        manifest_path.parent.mkdir(exist_ok=True, parents=True)
        with manifest_path.open("w+") as file:
            file.write(json.dumps(MOCK_MANIFEST))

        for entry in MOCK_MANIFEST.values():
            file = cast(dict, entry).get("file", "")
            file_path = Path(f"{MOCK_OUTPUT_PATH}/{file}")
            file_path.parent.mkdir(exist_ok=True, parents=True)
            with file_path.open("w+") as file:
                file.write("")

    def tearDown(self):
        rmtree(MOCK_OUTPUT_PATH)

    def tests_good_manifest_file(self):
        # attempt to init
        ProdViteIntegration({ "outdir": MOCK_OUTPUT_PATH })

    def tests_bad_manifest_file(self):
        # try to init a ProdViteIntegration instance with a bad manifest file

        ProdViteIntegration.manifest = None  # reset the manifest instance
        old_manifest_name = ProdViteIntegration.BUILD_MANIFEST

        ProdViteIntegration.BUILD_MANIFEST = "file/that/does/not/exist"

        with self.assertRaises(vite_exceptions.ManifestPathException):
            self.vite = ProdViteIntegration({ "outdir": MOCK_OUTPUT_PATH })

        # reset build manifest path to previous value
        ProdViteIntegration.BUILD_MANIFEST = old_manifest_name

    def tests_dev_tools(self):
        vite = ProdViteIntegration({ "outdir": MOCK_OUTPUT_PATH })
        dev_tools = vite.get_dev_tools()
        assert dev_tools == ""

    def tests_get_asset_url__bad_asset(self):
        vite = ProdViteIntegration({ "outdir": MOCK_OUTPUT_PATH })
        with self.assertRaises(vite_exceptions.ManifestContentException):
            vite.get_asset_url("this_asset_does_not_exist.ts")

    def tests_get_asset_url__bad_path(self):
        # try to load an asset declared in the manifest but without a real
        # file backing it
        # load a proper manifest...
        ProdViteIntegration.manifest = MOCK_MANIFEST
        # but also load a broken OUT_DIR path
        vite = ProdViteIntegration({ "outdir": "/tmp/path/does/not/exist" })
        with self.assertRaises(vite_exceptions.AssetPathException):
            vite.get_asset_url(MOCK_ASSET_PATH)

        # cleanup
        ProdViteIntegration.OUT_DIR = MOCK_OUTPUT_PATH
        ProdViteIntegration.manifest = None

    def tests_get_asset_url__is_not_ts(self):
        vite = ProdViteIntegration({ "outdir": MOCK_OUTPUT_PATH })
        url = vite.get_asset_url(MOCK_ASSET_PATH)
        assert MOCK_ASSET_PATH not in url  # source asset is a .ts file
        assert url.endswith(".js")  # dist asset is a .js file

    def tests_get_asset_url__is_not_scss(self):
        vite =ProdViteIntegration({ "outdir": MOCK_OUTPUT_PATH })
        url = vite.get_asset_url(MOCK_SCSS_PATH)
        assert MOCK_SCSS_PATH not in url  # source asset is a .scss file
        assert url.endswith(".css")  # dist asset is a .css file

    def tests_get_imported_chunks__bad_asset(self):
        vite = ProdViteIntegration({ "outdir": MOCK_OUTPUT_PATH })
        with self.assertRaises(vite_exceptions.ManifestContentException):
            vite.get_imported_chunks("this_asset_does_not_exist.ts")

    def tests_get_imported_chunks__bad_path(self):
        # try to load chunks for an asset declared in the manifest but
        # without a real file backing it
        # load a proper manifest...
        ProdViteIntegration.manifest = MOCK_MANIFEST
        # but also load a broken OUT_DIR path
        vite = ProdViteIntegration({ "outdir": "/tmp/path/does/not/exist" })
        with self.assertRaises(vite_exceptions.AssetPathException):
            vite.get_imported_chunks(MOCK_ASSET_PATH)

        # cleanup
        ProdViteIntegration.OUT_DIR = MOCK_OUTPUT_PATH
        ProdViteIntegration.manifest = None

    def tests_get_imported_chunks(self):
        vite = ProdViteIntegration({ "outdir": MOCK_OUTPUT_PATH })
        js_entries = filter(
            lambda x: x["file"].endswith(".js"), MOCK_MANIFEST.values()
        )
        assert len(vite.get_imported_chunks(MOCK_ASSET_PATH)) == (
            len(list(js_entries)) - 1
        )

    def tests_get_imported_css(self):
        vite = ProdViteIntegration({ "outdir": MOCK_OUTPUT_PATH })
        assert len(vite.get_imported_css(MOCK_ASSET_PATH)) == 1
