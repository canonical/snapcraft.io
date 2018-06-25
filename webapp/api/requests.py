# Core packages
import os
from urllib.parse import urlparse

# Third-party packages
import requests
import prometheus_client

# Local packages
from webapp.api.exceptions import (
    ApiTimeoutError,
    ApiConnectionError
)


timeout_counter = prometheus_client.Counter(
    'feed_timeouts',
    'A counter of timed out requests',
    ['domain'],
)
connection_failed_counter = prometheus_client.Counter(
    'feed_connection_failures',
    'A counter of requests which failed to connect',
    ['domain'],
)
latency_histogram = prometheus_client.Histogram(
    'feed_latency_seconds',
    'Feed requests retrieved',
    ['domain', 'code'],
    buckets=[0.25, 0.5, 0.75, 1, 2, 3],
)


def get(
        url,
        headers,
        json=None,
        data=None,
        method=None,
        files=None
):
    """
    WARNING: The cache is disabled due to a bug on our caching system.

    Retrieve the response from the requests cache.
    If the cache has expired then it will attempt to update the cache.
    If it gets an error, it will use the cached response, if it exists.
    """

    if method is None:
        method = "POST" if json else "GET"

    # TODO allow user to choose it's own user agent
    storefront_header = 'storefront ({commit_hash};{environment})'.format(
        commit_hash=os.getenv('COMMIT_ID', 'commit_id'),
        environment=os.getenv('ENVIRONMENT', 'devel')
    )
    headers.update({'User-Agent': storefront_header})
    domain = urlparse(url).netloc

    try:
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            json=json,
            files=files,
            data=data,
            timeout=3
        )
    except requests.exceptions.Timeout:
        timeout_counter.labels(domain=domain).inc()

        raise ApiTimeoutError(
            'The request to {} took longer than 3 seconds'.format(url),
        )
    except requests.exceptions.ConnectionError:
        connection_failed_counter.labels(domain=domain).inc()

        raise ApiConnectionError(
            'Failed to establish connection to {}.'.format(url)
        )

    latency_histogram.labels(domain=domain, code=response.status_code).observe(
        response.elapsed.total_seconds()
    )

    return response
