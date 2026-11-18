import atexit
import json
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import responses

from cache.cache_utility import redis_cache
from webapp.app import create_app


def _query_params_subset_matcher(expected_params):
    def _matcher(request):
        params = parse_qs(urlparse(request.url).query, keep_blank_values=True)

        for key, expected_value in expected_params.items():
            value = params.get(key, [None])[0]

            if expected_value == "" and value is None:
                continue

            if value != expected_value:
                message = (
                    "Expected query param "
                    f"'{key}' to be '{expected_value}', got '{value}'"
                )
                return (False, message)

        return (True, None)

    return _matcher


def _register_find(
    mocker,
    publisher,
    results,
):
    mocker.add(
        responses.GET,
        "https://api.snapcraft.io/v2/snaps/find",
        json={"results": results},
        status=200,
        match=[
            _query_params_subset_matcher(
                {
                    "q": "",
                    "fields": "title,summary,media,publisher",
                    "publisher": publisher,
                }
            )
        ],
    )


def _register_store_search(
    mocker,
    query,
    results,
):
    mocker.add(
        responses.GET,
        "https://api.snapcraft.io/v2/snaps/find",
        json={"results": results},
        status=200,
        match=[
            _query_params_subset_matcher(
                {
                    "q": query,
                    "fields": "title,summary,media,publisher,categories",
                }
            )
        ],
    )


def _register_categories(mocker):
    mocker.add(
        responses.GET,
        "https://api.snapcraft.io/v2/snaps/categories",
        json={"categories": []},
        status=200,
        match=[responses.matchers.query_param_matcher({"type": "shared"})],
    )


def _load_store_fixtures():
    fixtures_path = (
        Path(__file__).parent / "fixtures/main-baseline/store-fixtures.json"
    )

    with fixtures_path.open("r", encoding="utf-8") as fixtures_file:
        return json.load(fixtures_file)


def create_stubbed_app():
    redis_cache.fallback.clear()

    mocker = responses.RequestsMock(assert_all_requests_are_fired=False)
    mocker.start()

    atexit.register(mocker.stop)
    atexit.register(mocker.reset)

    _register_categories(mocker)

    store_fixtures = _load_store_fixtures()

    for publisher in ("jetbrains", "kde", "snapcrafters"):
        _register_find(
            mocker,
            publisher,
            store_fixtures[publisher]["results"],
        )

    _register_store_search(
        mocker,
        "publisher:snapcrafters",
        store_fixtures["snapcrafters"]["results"],
    )

    app = create_app(testing=True)
    app.config["SECRET_KEY"] = "test_key"
    app.config["WTF_CSRF_METHODS"] = []

    return app


if __name__ == "__main__":
    create_stubbed_app().run(
        host="127.0.0.1",
        port=8011,
        debug=False,
        use_reloader=False,
    )
