import os
import talisker.requests
from webapp import api
from webapp.api.exceptions import (
    ApiResponseDecodeError,
    ApiResponseError,
    ApiResponseErrorList,
)

SNAPCRAFT_IO_API = os.getenv(
    "SNAPCRAFT_IO_API", "https://api.snapcraft.io/api/v1/"
)

SNAPCRAFT_IO_API_V2 = os.getenv(
    "SNAPCRAFT_IO_API_V2", "https://api.snapcraft.io/v2/"
)

SNAP_INFO_URL = "".join(
    [
        SNAPCRAFT_IO_API_V2,
        "snaps/info/{snap_name}",
        "?fields=title,summary,description,license,contact,website,publisher,",
        "prices,media,download,version,created-at,confinement,categories",
    ]
)

SNAP_METRICS_URL = "".join([SNAPCRAFT_IO_API, "snaps/metrics"])

SNAP_SEARCH_URL = "".join(
    [
        SNAPCRAFT_IO_API,
        "snaps/search",
        "?q={snap_name}&page={page}&size={size}&scope=wide&arch=wide",
        "&confinement=strict,classic",
        "&fields=package_name,title,summary,icon_url,publisher,",
        "developer_validation,origin",
    ]
)

ALL_SNAPS_URL = "".join(
    [SNAPCRAFT_IO_API, "snaps/search", "?scope=wide&size={size}"]
)

FEATURE_SNAPS_URL = "".join(
    [
        SNAPCRAFT_IO_API,
        "snaps/search",
        "?confinement=strict,classic&section=featured&scope=wide",
        "&fields=package_name,title,icon_url",
    ]
)

PROMOTED_QUERY_URL = "".join(
    [
        SNAPCRAFT_IO_API,
        "snaps/search",
        "?promoted=true",
        "&confinement=strict,classic",
        "&fields=package_name,title,icon_url",
    ]
)

CATEGORIES_URL = "".join([SNAPCRAFT_IO_API, "snaps/sections"])


class StoreApi:
    headers = {"X-Ubuntu-Series": "16"}
    headers_v2 = {"Snap-Device-Series": "16"}

    def __init__(self, store=None, testing=False, cache=True):
        if store:
            self.headers.update({"X-Ubuntu-Store": store})
            self.headers_v2.update({"Snap-Device-Store": store})

        if testing or not cache:
            self.session = api.requests.Session()
        else:
            self.session = api.requests.CachedSession(timeout=(1, 6))

        self.session.headers.update(self.headers)
        self.session.headers.update(self.headers_v2)

        talisker.requests.configure(self.session)

    def process_response(self, response):
        try:
            body = response.json()
        except ValueError as decode_error:
            api_error_exception = ApiResponseDecodeError(
                "JSON decoding failed: {}".format(decode_error)
            )
            raise api_error_exception

        if not response.ok:
            if "error_list" in body or "error-list" in body:
                # V1 and V2 error handling
                error_body = (
                    body["error_list"]
                    if "error_list" in body
                    else body["error-list"]
                )
                api_error_exception = ApiResponseErrorList(
                    "The api returned a list of errors",
                    response.status_code,
                    error_body,
                )
                raise api_error_exception
            else:
                raise ApiResponseError(
                    "Unknown error from api", response.status_code
                )

        return body

    def get_all_snaps(self, size):
        all_snaps_response = self.session.get(ALL_SNAPS_URL.format(size=size))

        return self.process_response(all_snaps_response)

    def get_featured_snaps(self):
        featured_response = self.session.get(FEATURE_SNAPS_URL)

        return self.process_response(featured_response)

    def get_promoted_snaps(self):
        promoted_response = self.session.get(PROMOTED_QUERY_URL)

        return self.process_response(promoted_response)

    def get_searched_snaps(self, snap_searched, size, page, category=None):
        url = SNAP_SEARCH_URL.format(
            snap_name=snap_searched, size=size, page=page
        )

        if category:
            url += "&section=" + category

        searched_response = self.session.get(url)

        return self.process_response(searched_response)

    def get_snap_details(self, snap_name):
        details_response = self.session.get(
            SNAP_INFO_URL.format(snap_name=snap_name)
        )

        return self.process_response(details_response)

    def get_public_metrics(self, snap_name, json):
        metrics_headers = {"Content-Type": "application/json"}
        metrics_response = self.session.post(
            SNAP_METRICS_URL.format(snap_name=snap_name),
            headers=metrics_headers,
            json=json,
        )

        return self.process_response(metrics_response)

    def get_categories(self):
        categories_response = self.session.get(CATEGORIES_URL)

        return self.process_response(categories_response)
