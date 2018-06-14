import flask

from canonicalwebteam.snapstoreapi.exceptions import ApiError

from webapp.blog import api
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

        article = logic.transform_article(article, featured_image)

    context = {
        'current_page': page_param,
        'total_pages': int(total_pages),
        'articles': articles,
    }

    return flask.render_template('blog/index.html', **context)


@blog.route('/<slug>')
def post(slug):
    try:
        posts = api.get_posts(slug)
    except ApiError as api_error:
        return flask.abort(502, str(api_error))

    if not posts:
        flask.abort(404)

    context = {
        'post': posts[0]
    }

    return flask.render_template(
        'blog/post.html',
        **context)
