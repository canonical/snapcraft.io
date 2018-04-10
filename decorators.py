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
    @private_cache_headers
    def is_user_logged_in(*args, **kwargs):
        if not authentication.is_authenticated(flask.session):
            return flask.redirect('login?next=' + flask.request.path)

        return func(*args, **kwargs)
    return is_user_logged_in


def _cache_headers_decorator(route_function, cache_headers):
    """
    Return a decorator function to add a set of Cache-Control headers
    to the response
    """

    @functools.wraps(route_function)
    def decorated_function(*args, **kwargs):
        response = flask.make_response(
            route_function(*args, **kwargs)
        )

        if response.status_code == 200:
            # Only add caching headers to successful responses
            response.headers['Cache-Control'] = ', '.join(cache_headers)

        return response

    return decorated_function


def public_cache_headers(route_function):
    """
    Add standard caching headers to a public route:

    - Cache pages for 30 seconds
      (allows Squid to take significant load of the app)
    - Serve stale pages while revalidating the cache for 5 minutes
      (allows Squid to response instantly while doing cache refreshes)
    - Show stale pages if the app is erroring for 1 day
      (gives us a 1 day buffer to fix errors before they are publicly visible)
    """

    cache_headers = [
        'max-age=30',
        'stale-while-revalidate=300',
        'stale-if-error=86400',
    ]

    return _cache_headers_decorator(route_function, cache_headers)


def private_cache_headers(route_function):
    """
    Add standard caching headers to a private route:

    - Most importantly, add "private"
      (to prevent responses going where they shouldn't)
    """

    cache_headers = [
        'private',  # Important
    ]

    return _cache_headers_decorator(route_function, cache_headers)
