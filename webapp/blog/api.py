from canonicalwebteam.snapstoreapi import cache

API_URL = 'https://admin.insights.ubuntu.com/wp-json/wp/v2'


def get_articles():
    url = ''.join([API_URL, '/posts?tags=2080'])
    response = cache.get(url, {})

    return response.json()


def get_posts(slug):
    url = ''.join([
        API_URL,
        '/posts?slug=',
        slug,
        '&tags=2080',
    ])

    response = cache.get(url, {})
    return response.json()
