import flask

import webapp.api.blog as api
from webapp.api.exceptions import ApiError
from webapp.blog import logic
from webapp.extensions import cache

blog = flask.Blueprint(
    'blog', __name__,
    template_folder='/templates', static_folder='/static')


@blog.route('/')
@cache.cached(timeout=300)
def homepage():
    page_param = flask.request.args.get('page', default=1, type=int)

    try:
        articles, total_pages = api.get_articles(page=page_param)
    except ApiError as api_error:
        return flask.abort(502, str(api_error))

    for article in articles:
        try:
            featured_image = api.get_media(article['featured_media'])
        except ApiError:
            featured_image = None

        try:
            author = api.get_user(article['author'])
        except ApiError:
            author = None

        article = logic.transform_article(
            article,
            featured_image=featured_image,
            author=author)

    context = {
        'current_page': page_param,
        'total_pages': int(total_pages),
        'articles': articles,
    }

    return flask.render_template('blog/index.html', **context)


@blog.route('/feed')
@cache.cached(timeout=300)
def feed():
    try:
        feed = api.get_feed()
    except ApiError:
        return flask.abort(502)

    right_urls = logic.change_url(
        feed, flask.request.base_url.replace('/feed', ''))

    right_title = right_urls.replace('Ubuntu Blog', 'Snapcraft Blog')

    return flask.Response(right_title, mimetype='text/xml')


@blog.route('/<slug>')
@cache.cached(timeout=300)
def article(slug):
    try:
        articles = api.get_article(slug)
    except ApiError as api_error:
        return flask.abort(502, str(api_error))

    if not articles:
        flask.abort(404, 'Article not found')

    article = articles[0]

    try:
        author = api.get_user(article['author'])
    except ApiError:
        author = None

    transformed_article = logic.transform_article(article, author=author)

    tags = article['tags']

    try:
        related_articles, total_pages = api.get_articles(
            tags=tags,
            per_page=3,
            exclude=article['id'])
    except ApiError:
        related_articles = None

    if related_articles:
        for related_article in related_articles:
            related_article = logic.transform_article(related_article)

    context = {
        'article': transformed_article,
        'related_articles': related_articles
    }

    return flask.render_template(
        'blog/article.html',
        **context)
