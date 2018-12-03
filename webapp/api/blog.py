import os

from webapp import api
from webapp.api.exceptions import ApiResponseDecodeError, ApiResponseError

API_URL = os.getenv(
    "BLOG_API", "https://admin.insights.ubuntu.com/wp-json/wp/v2"
)
TAGS = [2996]  # 'snapcraft.io'


api_session = api.requests.CachedSession(expire_after=3600)


def process_response(response):
    if not response.ok:
        raise ApiResponseError("Error from api", response.status_code)

    try:
        body = response.json()
    except ValueError as decode_error:
        api_error_exception = ApiResponseDecodeError(
            "JSON decoding failed: {}".format(decode_error)
        )
        raise api_error_exception

    return body


def get_articles(tags=TAGS, per_page=12, page=1, exclude=None, category=None):
    url_parts = [
        API_URL,
        "/posts?tags=",
        "".join(str(tag) for tag in tags),
        "&per_page=",
        str(per_page),
        "&page=",
        str(page),
    ]

    if exclude:
        url_parts = url_parts + ["&exclude=", str(exclude)]

    if category:
        url_parts = url_parts + ["&categories=", str(category)]

    url = "".join(url_parts)

    response = api_session.get(url)
    total_pages = response.headers.get("X-WP-TotalPages")

    return process_response(response), total_pages


def get_article(slug):
    url = "".join(
        [
            API_URL,
            "/posts?slug=",
            slug,
            "&tags=",
            "".join(str(tag) for tag in TAGS),
        ]
    )

    response = api_session.get(url)

    return process_response(response)


def get_tag_by_name(name):
    url = "".join([API_URL, "/tags?search=", name])

    response = api_session.get(url)

    return process_response(response)


def get_tags_by_ids(ids):
    url = "".join([API_URL, "/tags?include=", ",".join(str(id) for id in ids)])

    response = api_session.get(url)

    return process_response(response)


def get_categories():
    url = "".join([API_URL, "/categories?", "per_page=100"])

    response = api_session.get(url)

    return process_response(response)


def get_category_by_id(id):
    url = "".join([API_URL, "/categories/", str(id)])

    response = api_session.get(url)

    return process_response(response)


def get_media(media_id):
    url = "".join([API_URL, "/media/", str(media_id)])
    response = api_session.get(url)

    if not response.ok:
        return None

    return process_response(response)


def get_user(user_id):
    url = "".join([API_URL, "/users/", str(user_id)])
    response = api_session.get(url)

    if not response.ok:
        return None

    return process_response(response)


def get_feed():
    """"""
    response = api_session.get(
        "https://admin.insights.ubuntu.com/?tag=snapcraft.io&feed=rss"
    )

    if not response.ok:
        return None

    return response.text
