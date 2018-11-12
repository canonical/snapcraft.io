import os
from urllib.parse import urlparse

import requests

import prometheus_client
import requests_cache
from pybreaker import CircuitBreaker, CircuitBreakerError
from webapp.api.exceptions import (
    ApiCircuitBreaker,
    ApiConnectionError,
    ApiTimeoutError,
)

timeout_counter = prometheus_client.Counter(
    "feed_timeouts", "A counter of timed out requests", ["domain"]
)
connection_failed_counter = prometheus_client.Counter(
    "feed_connection_failures",
    "A counter of requests which failed to connect",
    ["domain"],
)
latency_histogram = prometheus_client.Histogram(
    "feed_latency_seconds",
    "Feed requests retrieved",
    ["domain", "code"],
    buckets=[0.25, 0.5, 0.75, 1, 2, 3],
)


class TimeoutHTTPAdapter(requests.adapters.HTTPAdapter):
    def __init__(self, timeout=None, *args, **kwargs):
        self.timeout = timeout
        super().__init__(*args, **kwargs)

    def send(self, *args, **kwargs):
        kwargs["timeout"] = self.timeout
        return super().send(*args, **kwargs)


class BaseSession:
    """A base session interface to implement common functionality

    Create an interface to manage exceptions and return API exceptions
    """

    def __init__(self, timeout=(0.5, 3), *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.mount("http://", TimeoutHTTPAdapter(timeout=timeout))
        self.mount("https://", TimeoutHTTPAdapter(timeout=timeout))

        # TODO allow user to choose it's own user agent
        storefront_header = "storefront ({commit_hash};{environment})".format(
            commit_hash=os.getenv("COMMIT_ID", "commit_id"),
            environment=os.getenv("ENVIRONMENT", "devel"),
        )

        headers = {"User-Agent": storefront_header}
        self.headers.update(headers)
        self.api_breaker = CircuitBreaker(fail_max=5, reset_timeout=60)

    def request(self, method, url, **kwargs):
        domain = urlparse(url).netloc

        try:
            request = self.api_breaker.call(
                super().request, method=method, url=url, **kwargs
            )
        except requests.exceptions.Timeout:
            timeout_counter.labels(domain=domain).inc()

            raise ApiTimeoutError(
                "The request to {} took too long".format(url)
            )
        except requests.exceptions.ConnectionError:
            connection_failed_counter.labels(domain=domain).inc()

            raise ApiConnectionError(
                "Failed to establish connection to {}.".format(url)
            )
        except CircuitBreakerError:
            raise ApiCircuitBreaker(
                "Requests are closed because of too many failures".format(url)
            )

        latency_histogram.labels(
            domain=domain, code=request.status_code
        ).observe(request.elapsed.total_seconds())

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
