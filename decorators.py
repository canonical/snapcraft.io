# Core packages
import functools

# Third party packages
import flask
import modules.authentication as authentication


def login_required(func):
    """
    Decorator that checks if a user is logged in, and redirects
    to login page if not.
    """
    @functools.wraps(func)
    def is_user_logged_in(*args, **kwargs):
        if not authentication.is_authenticated(flask.session):
            return flask.redirect('login?next=' + flask.request.path)

        return func(*args, **kwargs)
    return is_user_logged_in


def public_cache_headers(decorated):
    """
    Add standard caching headers to a public route:

    - Cache pages for 30 seconds
      (allows Squid to take significant load of the app)
    - Serve stale pages while revalidating the cache for 5 minutes
      (allows Squid to response instantly while doing cache refreshes)
    - Show stale pages if the app is erroring for 1 day
      (gives us a 1 day buffer to fix errors before they are publicly visible)
    """

    cache_control_headers = [
        'max-age=30',
        'stale-while-revalidate=300',
        'stale-if-error=86400',
    ]

    @functools.wraps(decorated)
    def decorated_function(*args, **kwargs):
        response = flask.make_response(
            decorated(*args, **kwargs)
        )
        response.headers['Cache-Control'] = ', '.join(cache_control_headers)

        return response

    return decorated_function
