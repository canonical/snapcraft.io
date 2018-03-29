import os
import requests
from modules.exceptions import (
    ApiTimeoutError,
    ApiConnectionError
)

ENVIRONMENT = os.getenv(
    'ENVIRONMENT',
    'devel'
)

COMMIT_ID = os.getenv(
    'COMMIT_ID',
    'commit_id'
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

    storefront_header = 'storefront ({commit_hash};{environment})'.format(
        commit_hash=COMMIT_ID,
        environment=ENVIRONMENT
    )
    headers.update({'User-Agent': storefront_header})

    try:
        return requests.request(
            method=method,
            url=url,
            headers=headers,
            json=json,
            files=files,
            data=data,
            timeout=3
        )
    except requests.exceptions.Timeout:
        api_error_exception = ApiTimeoutError(
            'The request to {} took longer than 3 seconds'.format(url),
        )
        raise api_error_exception
    except requests.exceptions.ConnectionError:
        api_error_exception = ApiConnectionError(
            'Failed to establish connection to {}.'.format(url)
        )
        raise api_error_exception
