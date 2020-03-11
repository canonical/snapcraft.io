import os

import requests

import requests_cache
from pybreaker import CircuitBreaker, CircuitBreakerError
from webapp.api.exceptions import (
    ApiCircuitBreaker,
    ApiConnectionError,
    ApiTimeoutError,
)


class BaseSession:
    """A base session interface to implement common functionality

    Create an interface to manage exceptions and return API exceptions
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # TODO allow user to choose it's own user agent
        storefront_header = "storefront ({commit_hash};{environment})".format(
            commit_hash=os.getenv("COMMIT_ID", "commit_id"),
            environment=os.getenv("ENVIRONMENT", "devel"),
        )

        headers = {"User-Agent": storefront_header}
        self.headers.update(headers)
        self.api_breaker = CircuitBreaker(fail_max=5, reset_timeout=60)

    def request(self, method, url, **kwargs):
        try:
            request = self.api_breaker.call(
                super().request, method=method, url=url, **kwargs
            )
        except requests.exceptions.Timeout:
            raise ApiTimeoutError(
                "The request to {} took too long".format(url)
            )
        except requests.exceptions.ConnectionError:
            raise ApiConnectionError(
                "Failed to establish connection to {}.".format(url)
            )
        except CircuitBreakerError:
            raise ApiCircuitBreaker(
                "Requests are closed because of too many failures".format(url)
            )

        return request


class Session(BaseSession, requests.Session):
    pass


class CachedSession(BaseSession, requests_cache.CachedSession):
    def __init__(self, *args, **kwargs):
        # Set cache defaults
        options = {
            "backend": "sqlite",
            "expire_after": 5,
            # Include headers in cache key
            "include_get_headers": True,
            "old_data_on_error": True,
        }

        options.update(kwargs)

        super().__init__(*args, **options)
