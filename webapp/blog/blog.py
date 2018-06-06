import flask

blog_page = flask.Blueprint(
    'blog_page', __name__,
    template_folder='/templates', static_folder='/static')


@blog_page.route('/')
def homepage():
    return flask.render_template('blog/index.html')
