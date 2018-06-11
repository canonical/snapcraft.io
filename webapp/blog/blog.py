import flask

from canonicalwebteam.snapstoreapi.exceptions import ApiError

from webapp.blog import api

blog_page = flask.Blueprint(
    'blog_page', __name__,
    template_folder='/templates', static_folder='/static')


@blog_page.route('/')
def homepage():
    try:
        articles = api.get_articles()
    except ApiError as api_error:
        return flask.abort(502, str(api_error))

    context = {
        'articles': articles,
    }

    return flask.render_template('blog/index.html', **context)


@blog_page.route('/<slug>')
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
