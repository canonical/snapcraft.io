import flask
import humanize
import webapp.metrics.helper as metrics_helper
import webapp.metrics.metrics as metrics
from webapp.api.store import StoreApi
import webapp.store.logic as logic
from dateutil import parser
from math import floor
from webapp.api.exceptions import (
    ApiError,
    ApiTimeoutError,
    ApiResponseDecodeError,
    ApiResponseError,
    ApiResponseErrorList,
    ApiConnectionError
)
from urllib.parse import quote_plus


def store_blueprint(store=None):
    api = StoreApi(store)

    store = flask.Blueprint(
        'store', __name__,
        template_folder='/templates', static_folder='/static')

    def _handle_errors(api_error: ApiError):
        status_code = 502
        error = {
            'message': str(api_error)
        }

        if type(api_error) is ApiTimeoutError:
            status_code = 504
        elif type(api_error) is ApiResponseDecodeError:
            status_code = 502
        elif type(api_error) is ApiResponseErrorList:
            error['errors'] = api_error.errors
            status_code = 502
        elif type(api_error) is ApiResponseError:
            status_code = 502
        elif type(api_error) is ApiConnectionError:
            status_code = 502

        return status_code, error

    @store.route('/snaps')
    def snaps_view():
        return flask.redirect(
            flask.url_for('.store_view'))

    @store.route('/discover')
    def discover():
        return flask.redirect(
            flask.url_for('.store_view'))

    @store.route('/')
    @store.route('/store')
    def store_view():
        error_info = {}
        status_code = 200

        try:
            categories_results = api.get_categories()
        except ApiError as api_error:
            status_code, error_info = _handle_errors(api_error)

        categories = logic.get_categories(categories_results)

        try:
            featured_snaps_results = api.get_featured_snaps()
        except ApiError as api_error:
            status_code, error_info = _handle_errors(api_error)

        featured_snaps = logic.get_searched_snaps(
            featured_snaps_results
        )

        return flask.render_template(
            'store.html',
            featured_snaps=featured_snaps,
            categories=categories,
            error_info=error_info
        ), status_code

    @store.route('/search')
    def search_snap():
        status_code = 200
        snap_searched = flask.request.args.get('q', default='', type=str)
        snap_category = flask.request.args.get(
            'category',
            default='',
            type=str)

        if snap_category:
            snap_category_display = snap_category.capitalize().replace(
                '-', ' ')
        else:
            snap_category_display = None

        if not snap_searched and not snap_category:
            return flask.redirect(
                flask.url_for('.store_view'))

        size = flask.request.args.get('limit', default=25, type=int)
        offset = flask.request.args.get('offset', default=0, type=int)

        try:
            page = floor(offset / size) + 1
        except ZeroDivisionError:
            size = 10
            page = floor(offset / size) + 1

        error_info = {}
        featured_snaps = []
        categories_results = []
        searched_results = []

        try:
            categories_results = api.get_categories()
        except ApiError as api_error:
            status_code, error_info = _handle_errors(api_error)

        categories = logic.get_categories(categories_results)

        try:
            searched_results = api.get_searched_snaps(
                quote_plus(snap_searched),
                snap_category,
                size,
                page
            )
        except ApiError as api_error:
            status_code, error_info = _handle_errors(api_error)

        snaps_results = logic.get_searched_snaps(searched_results)
        links = logic.get_pages_details(
            flask.request.base_url,
            (
                searched_results['_links']
                if '_links' in searched_results
                else []
            )
        )

        if not snaps_results:
            try:
                featured_snaps_results = api.get_featured_snaps()
            except ApiError as api_error:
                status_code, error_info = _handle_errors(api_error)

            featured_snaps = logic.get_searched_snaps(
                featured_snaps_results
            )

        context = {
            "query": snap_searched,
            "category": snap_category,
            "category_display": snap_category_display,
            "categories": categories,
            "snaps": snaps_results,
            "links": links,
            "featured_snaps": featured_snaps,
            "error_info": error_info
        }

        return flask.render_template(
            'search.html',
            **context
        ), status_code

    @store.route('/<regex("[a-z0-9-]*[a-z][a-z0-9-]*"):snap_name>')
    def snap_details(snap_name):
        """
        A view to display the snap details page for specific snaps.

        This queries the snapcraft API (api.snapcraft.io) and passes
        some of the data through to the snap-details.html template,
        with appropriate sanitation.
        """

        error_info = {}

        try:
            details = api.get_snap_details(snap_name)
        except ApiTimeoutError as api_timeout_error:
            flask.abort(504, str(api_timeout_error))
        except ApiResponseDecodeError as api_response_decode_error:
            flask.abort(502, str(api_response_decode_error))
        except ApiResponseErrorList as api_response_error_list:
            if api_response_error_list.status_code == 404:
                flask.abort(404, 'No snap named {}'.format(snap_name))
            else:
                error_messages = ', '.join(
                    api_response_error_list.errors.key())
                flask.abort(502, error_messages)
        except ApiResponseError as api_response_error:
            flask.abort(502, str(api_response_error))
        except ApiError as api_error:
            flask.abort(502, str(api_error))

        formatted_paragraphs = logic.split_description_into_paragraphs(
            details['snap']['description'])

        channel_maps_list = logic.convert_channel_maps(
            details.get('channel-map'))

        latest_channel = logic.get_last_udpated_version(
            details.get('channel-map'))

        last_updated = latest_channel['created-at']
        last_version = latest_channel['version']
        binary_filesize = latest_channel['download']['size']

        end = metrics_helper.get_last_metrics_processed_date()
        country_metric_name = 'weekly_installed_base_by_country_percent'
        os_metric_name = 'weekly_installed_base_by_operating_system_normalized'

        metrics_query_json = [
            metrics_helper.get_filter(
                metric_name=country_metric_name,
                snap_id=details['snap-id'],
                start=end,
                end=end),
            metrics_helper.get_filter(
                metric_name=os_metric_name,
                snap_id=details['snap-id'],
                start=end,
                end=end)]

        status_code = 200
        try:
            metrics_response = api.get_public_metrics(
                snap_name,
                metrics_query_json)
        except ApiError as api_error:
            status_code, error_info = _handle_errors(api_error)
            metrics_response = None

        os_metrics = None
        country_devices = None
        if metrics_response:
            oses = metrics_helper.find_metric(metrics_response, os_metric_name)
            os_metrics = metrics.OsMetric(
                name=oses['metric_name'],
                series=oses['series'],
                buckets=oses['buckets'],
                status=oses['status'])

            territories = metrics_helper.find_metric(
                metrics_response, country_metric_name)
            country_devices = metrics.CountryDevices(
                name=territories['metric_name'],
                series=territories['series'],
                buckets=territories['buckets'],
                status=territories['status'],
                private=False)

        # filter out banner and banner-icon images from screenshots
        screenshots = [
            m['url'] for m in details['snap']['media']
            if m['type'] == "screenshot" and "banner" not in m['url']
        ]
        icons = [
            m['url'] for m in details['snap']['media'] if m['type'] == "icon"]

        context = {
            # Data direct from details API
            'snap_title': details['snap']['title'],
            'package_name': details['name'],
            'icon_url': icons[0] if icons else None,
            'version': last_version,
            'license': details['snap']['license'],
            'publisher': details['snap']['publisher']['display-name'],
            'screenshots': screenshots,
            'prices': details['snap']['prices'],
            'contact': details['snap'].get('contact'),
            'website': details['snap'].get('website'),
            'summary': details['snap']['summary'],
            'description_paragraphs': formatted_paragraphs,
            'channel_map': channel_maps_list,
            'developer_validation': details['snap']['publisher']['validation'],

            # Transformed API data
            'filesize': humanize.naturalsize(binary_filesize),
            'last_updated': (
                humanize.naturaldate(
                    parser.parse(last_updated)
                )
            ),
            'last_updated_raw': last_updated,

            # Data from metrics API
            'countries': (
                country_devices.country_data if country_devices else None
            ),
            'normalized_os': os_metrics.os if os_metrics else None,

            # Context info
            'is_linux': (
                'Linux' in flask.request.headers.get('User-Agent', '') and
                'Android' not in flask.request.headers.get('User-Agent', '')
            ),

            'error_info': error_info
        }

        return flask.render_template(
            'snap-details.html',
            **context
        ), status_code

    @store.route('/store/categories/<category>')
    def store_category(category):
        status_code = 200
        error_info = {}

        try:
            category_results = api.get_searched_snaps(
                snap_searched='',
                category=category,
                size=24,
                page=1
            )
        except ApiError as api_error:
            status_code, error_info = _handle_errors(api_error)

        snaps_results = logic.get_searched_snaps(category_results)

        context = {
            "category": category,
            "snaps": snaps_results,
            "error_info": error_info
        }

        return flask.render_template(
            '_category-partial.html',
            **context
        ), status_code

    return store
