from canonicalwebteam.snapstoreapi import cache

API_URL = 'https://admin.insights.ubuntu.com/wp-json/wp/v2'


def get_articles():
    url = API_URL + '/posts?tag=snappy'
    response = cache.get(url, {})

    return response.json()
