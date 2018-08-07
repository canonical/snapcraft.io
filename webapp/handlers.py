import flask
import socket
import webapp.template_utils as template_utils
from urllib.parse import (
    unquote,
    urlparse,
    urlunparse,
)
from webapp import authentication


def set_handlers(app):
    @app.context_processor
    def utility_processor():
        """
        This defines the set of properties and functions that will be added
        to the default context for processing templates. All these items
        can be used in all templates
        """

        if authentication.is_authenticated(flask.session):
            user_name = flask.session['openid']['fullname']
        else:
            user_name = None

        page_slug = template_utils.generate_slug(flask.request.path)

        return {
            # Variables
            'LOGIN_URL': app.config['LOGIN_URL'],
            'SENTRY_PUBLIC_DSN': app.config['SENTRY_PUBLIC_DSN'],
            'COMMIT_ID': app.config['COMMIT_ID'],
            'ENVIRONMENT': app.config['ENVIRONMENT'],
            'path': flask.request.path,
            'page_slug': page_slug,
            'user_name': user_name,
            'VERIFIED_PUBLISHER': 'verified',
            'webapp_config': app.config['WEBAPP_CONFIG'],
            'BSI_URL': app.config['BSI_URL'],

            # Functions
            'contains': template_utils.contains,
            'join': template_utils.join,
            'static_url': template_utils.static_url,
            'format_number': template_utils.format_number,
        }

    # Error handlers
    # ===
    @app.errorhandler(404)
    def page_not_found(error):
        """
        For 404 pages, display the 404.html template,
        passing through the error description.
        """

        return flask.render_template(
            '404.html', error=error.description
        ), 404

    # Global tasks for all requests
    # ===
    @app.before_request
    def clear_trailing():
        """
        Remove trailing slashes from all routes
        We like our URLs without slashes
        """

        parsed_url = urlparse(unquote(flask.request.url))
        path = parsed_url.path

        if path != '/' and path.endswith('/'):
            new_uri = urlunparse(
                parsed_url._replace(path=path[:-1])
            )

            return flask.redirect(new_uri)

    @app.after_request
    def add_headers(response):
        """
        Generic rules for headers to add to all requests

        - X-Hostname: Mention the name of the host/pod running the application
        - Cache-Control: Add cache-control headers for public and private pages
        """

        response.headers["X-Hostname"] = socket.gethostname()

        if response.status_code == 200:
            if flask.session:
                response.headers['Cache-Control'] = 'private'
            else:
                # Only add caching headers to successful responses
                response.headers['Cache-Control'] = ', '.join({
                    'public',
                    'max-age=61',
                    'stale-while-revalidate=300',
                    'stale-if-error=86400',
                })

        return response
