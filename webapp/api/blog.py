from webapp.api import cache

API_URL = 'https://admin.insights.ubuntu.com/wp-json/wp/v2'
TAGS = '2065'  # 'Snaps'


def get_articles(tags=TAGS, per_page=12, page=1, exclude=None):
    url_parts = [
        API_URL,
        '/posts?tags=',
        TAGS,
        '&per_page=',
        str(per_page),
        '&page=',
        str(page),
    ]

    if exclude:
        url_parts = url_parts + [
            '&exclude=',
            str(exclude)]

    url = ''.join(url_parts)

    response = cache.get(url, {})
    total_pages = response.headers.get('X-WP-TotalPages')

    return response.json(), total_pages


def get_article(slug):
    url = ''.join([
        API_URL,
        '/posts?slug=',
        slug,
        '&tags=',
        TAGS
    ])

    response = cache.get(url, {})

    return response.json()


def get_media(media_id):
    url = ''.join([API_URL, '/media/', str(media_id)])
    response = cache.get(url, {})

    if not response.ok:
        return None

    return response.json()


def get_user(user_id):
    url = ''.join([API_URL, '/users/', str(user_id)])
    response = cache.get(url, {})

    if not response.ok:
        return None

    return response.json()


def get_feed():
    """"""
    response = cache.get(
        'https://admin.insights.ubuntu.com/?tag=Snap&feed=rss', {})

    if not response.ok:
        return None

    return response.text
