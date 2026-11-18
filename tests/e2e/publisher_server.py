import atexit

import responses

from cache.cache_utility import redis_cache
from webapp.app import create_app


def _publisher(username, display_name, validation):
    return {
        "display-name": display_name,
        "id": f"{username}-id",
        "username": username,
        "validation": validation,
    }


def _snap_result(name, title, publisher):
    return {
        "name": name,
        "snap": {
            "media": [
                {
                    "height": 256,
                    "type": "icon",
                    "url": (
                        "https://dashboard.snapcraft.io/site_media/"
                        f"appmedia/{name}.png"
                    ),
                    "width": 256,
                }
            ],
            "publisher": publisher,
            "summary": f"{title} summary",
            "title": title,
        },
        "snap-id": f"{name}-id",
    }


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
            responses.matchers.query_param_matcher(
                {
                    "q": "",
                    "fields": "title,summary,media,publisher",
                    "publisher": publisher,
                }
            )
        ],
    )


def create_stubbed_app():
    redis_cache.fallback.clear()

    mocker = responses.RequestsMock(assert_all_requests_are_fired=False)
    mocker.start()

    atexit.register(mocker.stop)
    atexit.register(mocker.reset)

    _register_find(
        mocker,
        "jetbrains",
        [
            _snap_result(
                "intellij-idea",
                "IntelliJ IDEA",
                _publisher("jetbrains", "JetBrains", "verified"),
            ),
            _snap_result(
                "goland",
                "GoLand",
                _publisher("jetbrains", "JetBrains", "verified"),
            ),
        ],
    )

    _register_find(
        mocker,
        "kde",
        [
            _snap_result(
                "krita",
                "Krita",
                _publisher("kde", "KDE", "verified"),
            )
        ],
    )

    _register_find(
        mocker,
        "snapcrafters",
        [
            _snap_result(
                "sublime-text",
                "Sublime Text",
                _publisher("snapcrafters", "Snapcrafters", "starred"),
            ),
            _snap_result(
                "discord",
                "Discord",
                _publisher("snapcrafters", "Snapcrafters", "starred"),
            ),
            _snap_result(
                "alacritty",
                "Alacritty",
                _publisher("snapcrafters", "Snapcrafters", "starred"),
            ),
        ],
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
