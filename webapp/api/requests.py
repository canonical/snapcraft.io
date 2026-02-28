import os

import requests

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

    def request(self, method, url, timeout=12, **kwargs):
        try:
            request = self.api_breaker.call(
                super().request,
                method=method,
                url=url,
                timeout=timeout,
                **kwargs
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
                "Requests are closed because of too many failures {}".format(
                    url
                )
            )

        return request


class Session(BaseSession, requests.Session):
    pass


class PublisherSession(BaseSession, requests.Session):
    def request(self, method, url, timeout=None, **kwargs):
        return super().request(method, url, timeout, **kwargs)
