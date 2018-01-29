import datetime
import requests
import requests_cache
from requests.packages.urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
from requests.exceptions import RequestException

# Setup session to retry requests 5 times
uncached_session = requests.Session()
retries = Retry(
    total=5,
    backoff_factor=0.1,
    status_forcelist=[500, 502, 503, 504]
)
uncached_session.mount(
    'https://api.snapcraft.io',
    HTTPAdapter(max_retries=retries)
)

# The cache expires after 5 seconds
cached_session = requests_cache.CachedSession(expire_after=5)

# Requests should timeout after 2 seconds in total
request_timeout = 2


def get(
        url,
        headers,
        json=None,
        data=None,
        method=None,
        files=None
):
    """
    Retrieve the response from the requests cache.
    If the cache has expired then it will attempt to update the cache.
    If it gets an error, it will use the cached response, if it exists.
    """

    request_error = False

    if method is None:
        method = "POST" if json else "GET"

    request = cached_session.prepare_request(
        requests.Request(
            method=method,
            url=url,
            headers=headers,
            json=json,
            files=files,
            data=data
        )
    )

    cache_key = cached_session.cache.create_key(request)
    response, timestamp = cached_session.cache.get_response_and_time(
        cache_key
    )

    if response:
        age = datetime.datetime.utcnow() - timestamp

        if age > cached_session._cache_expire_after:
            try:
                new_response = uncached_session.send(
                    request,
                    timeout=request_timeout
                )
                if response.status_code >= 500:
                    new_response.raise_for_status()
            except RequestException:
                request_error = True
            else:
                response = new_response
    else:
        response = cached_session.send(request)

    response.old_data_from_error = request_error

    return response
