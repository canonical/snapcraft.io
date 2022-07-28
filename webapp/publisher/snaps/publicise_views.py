# Packages
import flask
from canonicalwebteam.store_api.stores.snapstore import (
    SnapStore,
    SnapPublisher,
)
from canonicalwebteam.store_api.exceptions import (
    StoreApiError,
    StoreApiResponseErrorList,
)

# Local
from webapp.helpers import api_publisher_session
from webapp.api.exceptions import ApiError
from webapp.decorators import login_required
from webapp.publisher.views import _handle_error, _handle_error_list
from webapp.store.logic import filter_screenshots

store_api = SnapStore(api_publisher_session)
publisher_api = SnapPublisher(api_publisher_session)


@login_required
def get_publicise(snap_name):
    try:
        snap_details = publisher_api.get_snap_info(snap_name, flask.session)
    except StoreApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except (StoreApiError, ApiError) as api_error:
        return _handle_error(api_error)

    is_released = len(snap_details["channel_maps_list"]) > 0

    available_languages = {
        "ar": {"title": "العربية", "text": "احصل عليه من Snap Store"},
        "bg": {"title": "български", "text": "Инсталирайте го от Snap Store"},
        "bn": {"title": "বাংলা", "text": "থেকে ইনস্টল করুন"},
        "de": {"title": "Deutsch", "text": "Installieren vom Snap Store"},
        "en": {"title": "English", "text": "Get it from the Snap Store"},
        "es": {"title": "Español", "text": "Instalar desde Snap Store"},
        "fr": {
            "title": "Français",
            "text": "Installer à partir du Snap Store",
        },
        "it": {"title": "Italiano", "text": "Scarica dallo Snap Store"},
        "jp": {"title": "日本語", "text": "Snap Store から入手ください"},
        "pl": {"title": "Polski", "text": "Pobierz w Snap Store"},
        "pt": {"title": "Português", "text": "Disponível na Snap Store"},
        "ro": {"title": "Română", "text": "Instalează din Snap Store"},
        "ru": {"title": "русский язык", "text": "Загрузите из Snap Store"},
        "tw": {"title": "中文（台灣）", "text": "安裝軟體敬請移駕 Snap Store"},
    }

    context = {
        "private": snap_details["private"],
        "snap_name": snap_details["snap_name"],
        "snap_title": snap_details["title"],
        "publisher_name": snap_details["publisher"]["display-name"],
        "snap_id": snap_details["snap_id"],
        "is_release": is_released,
        "available": available_languages,
        "download_version": "v1.4.2",
    }

    return flask.render_template(
        "publisher/publicise/store_buttons.html", **context
    )


@login_required
def get_publicise_badges(snap_name):
    try:
        snap_details = publisher_api.get_snap_info(snap_name, flask.session)
    except StoreApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except (StoreApiError, ApiError) as api_error:
        return _handle_error(api_error)

    if snap_details["private"]:
        return flask.abort(404, "No snap named {}".format(snap_name))

    try:
        snap_public_details = store_api.get_item_details(
            snap_name, api_version=2
        )
    except (StoreApiError, ApiError) as api_error:
        return _handle_error(api_error)

    context = {
        "snap_name": snap_details["snap_name"],
        "snap_title": snap_details["title"],
        "publisher_name": snap_details["publisher"]["display-name"],
        "snap_id": snap_details["snap_id"],
        "trending": snap_public_details["snap"]["trending"],
    }

    return flask.render_template(
        "publisher/publicise/github_badges.html", **context
    )


@login_required
def get_publicise_cards(snap_name):
    try:
        snap_details = publisher_api.get_snap_info(snap_name, flask.session)
    except StoreApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, "No snap named {}".format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except (StoreApiError, ApiError) as api_error:
        return _handle_error(api_error)

    if snap_details["private"]:
        return flask.abort(404, "No snap named {}".format(snap_name))

    screenshots = filter_screenshots(snap_details["media"])
    has_screenshot = True if screenshots else False

    context = {
        "has_screenshot": has_screenshot,
        "snap_name": snap_details["snap_name"],
        "snap_title": snap_details["title"],
        "publisher_name": snap_details["publisher"]["display-name"],
        "snap_id": snap_details["snap_id"],
    }

    return flask.render_template(
        "publisher/publicise/embedded_cards.html", **context
    )
