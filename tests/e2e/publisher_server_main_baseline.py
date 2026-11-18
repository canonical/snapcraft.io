import argparse
import atexit
import json
import os
import sys
from pathlib import Path

import responses


def _register_find(mocker, publisher, results):
    mocker.add(
        responses.GET,
        "https://api.snapcraft.io/v2/snaps/find",
        json={"results": results},
        status=200,
        match=[
            responses.matchers.query_param_matcher(
                {
                    "q": "",
                    "fields": "title,summary,media,publisher",
                    "publisher": publisher,
                }
            )
        ],
    )


def _load_store_fixtures():
    fixtures_path = (
        Path(__file__).parent / "fixtures/main-baseline/store-fixtures.json"
    )

    with fixtures_path.open("r", encoding="utf-8") as fixtures_file:
        return json.load(fixtures_file)


def _import_main_app_modules(main_export_root):
    if main_export_root and main_export_root not in sys.path:
        sys.path.insert(0, main_export_root)

    from cache.cache_utility import redis_cache
    from webapp.app import create_app

    return redis_cache, create_app


def create_stubbed_app(main_export_root):
    redis_cache, create_app = _import_main_app_modules(main_export_root)
    redis_cache.fallback.clear()

    mocker = responses.RequestsMock(assert_all_requests_are_fired=False)
    mocker.start()

    atexit.register(mocker.stop)
    atexit.register(mocker.reset)

    for publisher, payload in _load_store_fixtures().items():
        _register_find(mocker, publisher, payload["results"])

    app = create_app(testing=True)
    app.config["SECRET_KEY"] = "test_key"
    app.config["WTF_CSRF_METHODS"] = []

    return app


def _parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dump-fixtures", default=None)
    parser.add_argument(
        "--main-export-root",
        default=os.environ.get("SNAPCRAFT_MAIN_EXPORT_ROOT", None),
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("BASELINE_SERVER_PORT", "8012")),
    )

    return parser.parse_args()


def main():
    args = _parse_args()

    fixtures = _load_store_fixtures()

    if args.dump_fixtures:
        with open(args.dump_fixtures, "w", encoding="utf-8") as output_file:
            json.dump(fixtures, output_file, indent=2, sort_keys=True)
            output_file.write("\n")
        return

    app = create_stubbed_app(args.main_export_root)
    app.run(
        host="127.0.0.1",
        port=args.port,
        debug=False,
        use_reloader=False,
    )


if __name__ == "__main__":
    main()
