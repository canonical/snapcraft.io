import datetime
import flask
import humanize
import modules.public.api as api
import modules.public.logic as logic
from dateutil import parser, relativedelta
from modules.exceptions import (
    ApiError,
    ApiTimeoutError,
    ApiResponseDecodeError,
    ApiResponseError,
    ApiResponseErrorList,
    ApiConnectionError
)
from urllib.parse import quote_plus


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


def homepage():
    featured_snaps = []
    error_info = {}
    status_code = 200
    try:
        featured_snaps = logic.get_searched_snaps(
            api.get_featured_snaps()
        )
    except ApiError as api_error:
        status_code, error_info = _handle_errors(api_error)

    return flask.render_template(
        'index.html',
        featured_snaps=featured_snaps,
        error_info=error_info
    ), status_code


def store():
    featured_snaps = []
    error_info = {}
    status_code = 200
    try:
        featured_snaps = logic.get_searched_snaps(
            api.get_featured_snaps()
        )
    except ApiError as api_error:
        status_code, error_info = _handle_errors(api_error)

    return flask.render_template(
        'store.html',
        featured_snaps=featured_snaps,
        page_slug='store',
        error_info=error_info
    ), status_code


def snaps():
    promoted_snaps = []
    error_info = {}
    status_code = 200
    try:
        promoted_snaps = logic.get_searched_snaps(
            api.get_promoted_snaps()
        )
    except ApiError as api_error:
        status_code, error_info = _handle_errors(api_error)

    return flask.render_template(
        'promoted.html',
        snaps=promoted_snaps,
        error_info=error_info
    ), status_code


def search_snap():
    status_code = 200
    snap_searched = flask.request.args.get('q', default='', type=str)
    if not snap_searched:
        return flask.redirect('/store')

    size, page = logic.convert_args_search(
        flask.request.args.get('limit', default=10, type=int),
        flask.request.args.get('offset', default=0, type=int)
    )

    error_info = {}
    snaps_results = []
    links = []
    try:
        searched_results = api.get_searched_snaps(
            quote_plus(snap_searched),
            size,
            page
        )

        snaps_results = logic.get_searched_snaps(searched_results)
        links = logic.get_pages_details(
            flask.request.base_url,
            (
                searched_results['_links']
                if '_links' in searched_results
                else []
            )
        )
    except ApiError as api_error:
        status_code, error_info = _handle_errors(api_error)

    context = {
        "query": snap_searched,
        "snaps": snaps_results,
        "links": links,
        "error_info": error_info

    }

    return flask.render_template(
        'search.html',
        **context
    )


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
            error_messages = ', '.join(api_response_error_list.errors.key())
            flask.abort(502, error_messages)
    except ApiResponseError as api_response_error:
        flask.abort(502, str(api_response_error))
    except ApiError as api_error:
        flask.abort(502, str(api_error))

    formatted_paragraphs = logic.format_paragraphs(details['description'])

    status_code = 200
    country_data = []
    try:
        today = datetime.datetime.utcnow().date()
        week_ago = today - relativedelta.relativedelta(weeks=1)

        metrics_query_json = [
            {
                "metric_name": "installed_base_by_country_percent",
                "snap_id": details['snap_id'],
                "start": week_ago.strftime('%Y-%m-%d'),
                "end": today.strftime('%Y-%m-%d')
            }
        ]

        metrics_response = api.get_public_metrics(
            snap_name,
            metrics_query_json
        )

        users_by_country = logic.transform_metrics(
            metrics_response[0]['series']
        )
        country_data = logic.build_country_info(users_by_country)
    except ApiError as api_error:
        status_code, error_info = _handle_errors(api_error)

    context = {
        # Data direct from details API
        'snap_title': details['title'],
        'package_name': details['package_name'],
        'icon_url': details['icon_url'],
        'version': details['version'],
        'revision': details['revision'],
        'license': details['license'],
        'publisher': details['publisher'],
        'screenshot_urls': details['screenshot_urls'],
        'prices': details['prices'],
        'contact': details.get('contact'),
        'website': details.get('website'),
        'summary': details['summary'],
        'description_paragraphs': formatted_paragraphs,

        # Transformed API data
        'filesize': humanize.naturalsize(details['binary_filesize']),
        'last_updated': (
            humanize.naturaldate(
                parser.parse(details.get('last_updated'))
            )
        ),

        # Data from metrics API
        'countries': country_data,

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
