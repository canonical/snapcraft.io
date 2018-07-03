import os
from webapp.api import cache
from webapp.api.exceptions import (
    ApiResponseDecodeError,
    ApiResponseError,
    ApiResponseErrorList
)

SNAPCRAFT_IO_API = os.getenv(
    'SNAPCRAFT_IO_API',
    'https://api.snapcraft.io/api/v1/',
)

SNAP_DETAILS_URL = ''.join([
    SNAPCRAFT_IO_API,
    'snaps/details/{snap_name}',
    '?channel={snap_channel}',
    '&fields=snap_id,package_name,title,summary,description,license,contact,',
    'website,publisher,prices,media,',
    # Released (stable) revision fields will eventually be replaced by
    # `channel_maps_list` contextual information.
    'revision,version,binary_filesize,last_updated,',
    'developer_validation,channel_maps_list'
])

SNAP_METRICS_URL = ''.join([
    SNAPCRAFT_IO_API,
    'snaps/metrics',
])

SNAP_SEARCH_URL = ''.join([
    SNAPCRAFT_IO_API,
    'snaps/search',
    '?q={snap_name}&page={page}&size={size}',
    '&confinement=strict,classic',
    '&fields=package_name,title,summary,icon_url,publisher,',
    'developer_validation'
])

FEATURE_SNAPS_URL = ''.join([
    SNAPCRAFT_IO_API,
    'snaps/search',
    '?confinement=strict,classic&section=featured',
    '&fields=package_name,title,icon_url'
])

PROMOTED_QUERY_URL = ''.join([
    SNAPCRAFT_IO_API,
    'snaps/search',
    '?promoted=true',
    '&confinement=strict,classic',
    '&fields=package_name,title,icon_url'
])

CATEGORIES_URL = ''.join([
    SNAPCRAFT_IO_API,
    'snaps/sections'
])


class StoreApi:
    headers = {'X-Ubuntu-Series': '16'}

    def __init__(self, store=None):
        if store:
            self.headers.update({'X-Ubuntu-Store': store})

    def process_response(self, response):
        try:
            body = response.json()
        except ValueError as decode_error:
            api_error_exception = ApiResponseDecodeError(
                'JSON decoding failed: {}'.format(decode_error),
            )
            raise api_error_exception

        if not response.ok:
            if 'error_list' in body:
                api_error_exception = ApiResponseErrorList(
                    'The api returned a list of errors',
                    response.status_code,
                    body['error_list']
                )
                raise api_error_exception
            else:
                raise ApiResponseError(
                    'Unknown error from api',
                    response.status_code
                )

        return body

    def get_featured_snaps(self):
        featured_response = cache.get(
            FEATURE_SNAPS_URL,
            headers=self.headers
        )

        return self.process_response(featured_response)

    def get_promoted_snaps(self):
        promoted_response = cache.get(
            PROMOTED_QUERY_URL,
            headers=self.headers
        )

        return self.process_response(promoted_response)

    def get_searched_snaps(self, snap_searched, category, size, page):
        url = SNAP_SEARCH_URL.format(
            snap_name=snap_searched,
            size=size,
            page=page
        )

        if category:
            url += '&section=' + category

        searched_response = cache.get(
            url,
            headers=self.headers
        )

        return self.process_response(searched_response)

    def get_snap_details(self, snap_name, snap_channel):
        details_headers = self.headers.copy()
        details_headers.update({'X-Ubuntu-Architecture': 'any'})
        details_response = cache.get(
            SNAP_DETAILS_URL.format(
                snap_name=snap_name,
                snap_channel=snap_channel),
            headers=self.headers
        )

        return self.process_response(details_response)

    def get_public_metrics(self, snap_name, json):
        metrics_headers = self.headers.copy()
        metrics_headers.update({'Content-Type': 'application/json'})
        metrics_response = cache.get(
            SNAP_METRICS_URL.format(snap_name=snap_name),
            headers=metrics_headers,
            json=json
        )

        return self.process_response(metrics_response)

    def get_categories(self):
        categories_response = cache.get(
            CATEGORIES_URL,
            headers=self.headers
        )

        return self.process_response(categories_response)
