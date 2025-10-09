import os

from requests import Session as RequestsSession
from requests.exceptions import Timeout, ConnectionError

from webapp.api.exceptions import ApiConnectionError, ApiTimeoutError


class GeventGreenletTimeout(Exception):
    pass


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
        headers = {"User-Agent": storefront_header, "Connection": "close"}
        self.headers.update(headers)

    def request(self, method, url, timeout=12, **kwargs):
        try:
            return super().request(
                method=method, url=url, timeout=timeout, **kwargs
            )
        except Timeout:
            raise ApiTimeoutError(
                "The request to {} took too long".format(url)
            )
        except ConnectionError:
            raise ApiConnectionError(
                "Failed to establish connection to {}.".format(url)
            )


class Session(BaseSession, RequestsSession):
    pass


class PublisherSession(BaseSession, RequestsSession):
    def request(self, method, url, timeout=None, **kwargs):
        return super().request(method, url, timeout, **kwargs)
