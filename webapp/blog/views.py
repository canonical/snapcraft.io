import flask

import webapp.api.blog as api
from webapp.api.exceptions import ApiError
from webapp.blog import logic

blog = flask.Blueprint(
    'blog', __name__,
    template_folder='/templates', static_folder='/static')


@blog.route('/')
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
    tag_names = []
    try:
        tag_names_response = api.get_tags_by_ids(tags)
    except ApiError:
        tag_names_response = None

    if tag_names_response:
        for tag in tag_names_response:
            tag_names.append({
                'id': tag['id'],
                'name': tag['name']
            })

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
        'related_articles': related_articles,
        'tags': tag_names
    }

    return flask.render_template(
        'blog/article.html',
        **context)


@blog.route('/api/snap-posts/<snap>')
def snap_posts(snap):
    try:
        blog_tags = api.get_tag_by_name(''.join(['sc:snap:', snap]))
    except ApiError:
        blog_tags = None

    blog_articles = None
    articles = []

    if blog_tags:
        blog_tags_ids = logic.get_tag_id_list(blog_tags)
        try:
            blog_articles, total_pages = api.get_articles(
                blog_tags_ids,
                3
            )
        except ApiError:
            blog_articles = None

        for article in blog_articles:
            transformed_article = logic.transform_article(
                article,
                featured_image=None,
                author=None)
            articles.append({
                'slug': transformed_article['slug'],
                'title': transformed_article['title']['rendered']
            })

    return flask.jsonify(articles)


@blog.route('/api/series/<series>')
def snap_series(series):
    blog_articles = None
    articles = []

    try:
        blog_articles, total_pages = api.get_articles(series)
    except ApiError:
        blog_articles = None

    for article in blog_articles:
        transformed_article = logic.transform_article(
            article,
            featured_image=None,
            author=None)
        articles.append({
            'slug': transformed_article['slug'],
            'title': transformed_article['title']['rendered']
        })

    return flask.jsonify(articles)
