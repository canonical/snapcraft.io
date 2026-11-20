import atexit
from urllib.parse import parse_qs, urlparse

import responses

from cache.cache_utility import redis_cache
from webapp.app import create_app

STORE_FIXTURES = {
    "jetbrains": {
        "results": [
            {
                "name": "intellij-idea",
                "snap": {
                    "media": [
                        {
                            "height": 256,
                            "type": "icon",
                            "url": (
                                "https://dashboard.snapcraft.io/site_media/"
                                "appmedia/2025/11/IntelliJ_IDEA_icon.svg.png"
                            ),
                            "width": 256,
                        }
                    ],
                    "publisher": {
                        "display-name": "JetBrains",
                        "id": "jetbrains-id",
                        "username": "jetbrains",
                        "validation": "verified",
                    },
                    "summary": "IntelliJ IDEA summary",
                    "title": "IntelliJ IDEA",
                },
                "snap-id": "intellij-idea-id",
            },
            {
                "name": "goland",
                "snap": {
                    "media": [
                        {
                            "height": 256,
                            "type": "icon",
                            "url": (
                                "https://dashboard.snapcraft.io/site_media/"
                                "appmedia/2024/06/Avatar-4_Mo31k0N.png"
                            ),
                            "width": 256,
                        }
                    ],
                    "publisher": {
                        "display-name": "JetBrains",
                        "id": "jetbrains-id",
                        "username": "jetbrains",
                        "validation": "verified",
                    },
                    "summary": "GoLand summary",
                    "title": "GoLand",
                },
                "snap-id": "goland-id",
            },
        ]
    },
    "kde": {
        "results": [
            {
                "name": "krita",
                "snap": {
                    "media": [
                        {
                            "height": 256,
                            "type": "icon",
                            "url": (
                                "https://dashboard.snapcraft.io/site_media/"
                                "appmedia/2019/04/unnamed.png"
                            ),
                            "width": 256,
                        }
                    ],
                    "publisher": {
                        "display-name": "KDE",
                        "id": "kde-id",
                        "username": "kde",
                        "validation": "verified",
                    },
                    "summary": "Krita summary",
                    "title": "Krita",
                },
                "snap-id": "krita-id",
            }
        ]
    },
    "snapcrafters": {
        "results": [
            {
                "name": "sublime-text",
                "snap": {
                    "media": [
                        {
                            "height": 256,
                            "type": "icon",
                            "url": (
                                "https://dashboard.snapcraft.io/site_media/"
                                "appmedia/2018/03/sublime-text.png"
                            ),
                            "width": 256,
                        }
                    ],
                    "publisher": {
                        "display-name": "Snapcrafters",
                        "id": "snapcrafters-id",
                        "username": "snapcrafters",
                        "validation": "starred",
                    },
                    "summary": "Sublime Text summary",
                    "title": "Sublime Text",
                },
                "snap-id": "sublime-text-id",
            },
            {
                "name": "discord",
                "snap": {
                    "media": [
                        {
                            "height": 256,
                            "type": "icon",
                            "url": (
                                "https://dashboard.snapcraft.io/site_media/"
                                "appmedia/2023/10/com.discordapp.Discord_1.png"
                            ),
                            "width": 256,
                        }
                    ],
                    "publisher": {
                        "display-name": "Snapcrafters",
                        "id": "snapcrafters-id",
                        "username": "snapcrafters",
                        "validation": "starred",
                    },
                    "summary": "Discord summary",
                    "title": "Discord",
                },
                "snap-id": "discord-id",
            },
            {
                "name": "alacritty",
                "snap": {
                    "media": [
                        {
                            "height": 256,
                            "type": "icon",
                            "url": (
                                "https://dashboard.snapcraft.io/site_media/"
                                "appmedia/2019/12/icon.svg_WTg5Oeb.png"
                            ),
                            "width": 256,
                        }
                    ],
                    "publisher": {
                        "display-name": "Snapcrafters",
                        "id": "snapcrafters-id",
                        "username": "snapcrafters",
                        "validation": "starred",
                    },
                    "summary": "Alacritty summary",
                    "title": "Alacritty",
                },
                "snap-id": "alacritty-id",
            },
        ]
    },
}


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


def _install_store_mocks():
    """Install the Store API request mocks in the current process.

    responses patches requests per-process, so under gunicorn each worker
    must register its own mocks (done via the post_fork hook below).
    """
    redis_cache.fallback.clear()

    mocker = responses.RequestsMock(assert_all_requests_are_fired=False)
    mocker.start()

    atexit.register(mocker.stop)
    atexit.register(mocker.reset)

    _register_categories(mocker)

    for publisher in ("jetbrains", "kde", "snapcrafters"):
        _register_find(
            mocker,
            publisher,
            STORE_FIXTURES[publisher]["results"],
        )

    _register_store_search(
        mocker,
        "publisher:snapcrafters",
        STORE_FIXTURES["snapcrafters"]["results"],
    )

    # Synthetic publisher whose curated listed_snaps are all unavailable
    # from the Store API, to exercise the "snaps not available" state.
    _register_find(mocker, "unavailable-snaps", [])


def _stubbed_registry_entries():
    return {
        "unavailable-snaps": {
            "display_name": "Unavailable Snaps",
            "summary": "Summary",
            "description": "<p>Description</p>",
            "publisher_since": "January 2024",
            "listed_snaps": [{"package_name": "missing-snap"}],
        }
    }


def create_stubbed_app():
    _install_store_mocks()

    app = create_app(testing=True)
    app.config["SECRET_KEY"] = "test_key"
    app.config["WTF_CSRF_METHODS"] = []
    app.extensions["publisher_pages_registry"].update(
        _stubbed_registry_entries()
    )

    return app


# Gunicorn settings used when this module is passed as a config file.
bind = "127.0.0.1:8011"
# Sync workers with threads give concurrency without gevent's monkey-patching,
# which conflicts with a Django settings lazy-object imported by the app.
worker_class = "gthread"
workers = 2
threads = 8
wsgi_app = "tests.e2e.publisher_server:application"


class _LazyStubbedApp:
    """Build the stubbed app lazily inside each worker process.

    responses patches requests per-process, so the app (and its mocks) must
    be created in the worker, not in the gunicorn master. Gunicorn imports
    the WSGI app in the master before forking; deferring construction to the
    first request ensures each worker builds its own stubbed app.
    """

    _app = None

    def __call__(self, environ, start_response):
        if _LazyStubbedApp._app is None:
            _LazyStubbedApp._app = create_stubbed_app()
        return _LazyStubbedApp._app(environ, start_response)


application = _LazyStubbedApp()


if __name__ == "__main__":
    create_stubbed_app().run(
        host="127.0.0.1",
        port=8011,
        debug=False,
        use_reloader=False,
    )
