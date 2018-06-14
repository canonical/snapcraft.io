from canonicalwebteam.snapstoreapi import cache

API_URL = 'https://admin.insights.ubuntu.com/wp-json/wp/v2'
TAGS = '2065'  # 'Snaps'


def get_articles(page):
    url = ''.join([
        API_URL,
        '/posts?tags=',
        TAGS,
        '&per_page=12&page=',
        str(page)
    ])

    response = cache.get(url, {})
    total_pages = response.headers.get('X-WP-TotalPages')

    return response.json(), total_pages


def get_posts(slug):
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


def get_feed():
    """"""
    response = cache.get(
        'https://admin.insights.ubuntu.com/?tag=Snap&feed=rss', {})

    if not response.ok:
        return None

    return response.text
