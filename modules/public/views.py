import bleach
import datetime
import flask
import humanize
import modules.public.api as api
import pycountry
import re
from dateutil import parser, relativedelta
from modules.exceptions import (
    ApiError,
    ApiTimeoutError,
    ApiResponseDecodeError,
    ApiResponseError,
    ApiResponseErrorList
)
from math import floor
from urllib.parse import parse_qs, urlparse, quote_plus


def calculate_colors(countries, max_users):
    for country_code in countries:
        countries[country_code]['color_rgb'] = [
            calculate_color(
                countries[country_code]['percentage_of_users'],
                max_users,
                8,
                229
            ),
            calculate_color(
                countries[country_code]['percentage_of_users'],
                max_users,
                64,
                245
            ),
            calculate_color(
                countries[country_code]['percentage_of_users'],
                max_users,
                129,
                223
            )
        ]


def calculate_color(thisCountry, maxCountry, maxColor, minColor):
    countryFactor = float(thisCountry)/maxCountry
    colorRange = maxColor - minColor
    return int(colorRange*countryFactor+minColor)


def normalize_metrics(geodata):
    users_by_country = {}
    max_users = 0.0
    for country_counts in geodata:
        country_code = country_counts['name']
        users_by_country[country_code] = {}
        counts = []
        for daily_count in country_counts['values']:
            if daily_count is not None:
                counts.append(daily_count)

        if len(counts) > 0:
            users_by_country[country_code]['number_of_users'] = (
                sum(counts)
            )
            users_by_country[country_code]['percentage_of_users'] = (
                sum(counts) / len(counts)
            )
        else:
            users_by_country[country_code]['number_of_users'] = 0
            users_by_country[country_code]['percentage_of_users'] = 0

        if max_users < users_by_country[country_code]['percentage_of_users']:
            max_users = users_by_country[country_code]['percentage_of_users']

    calculate_colors(users_by_country, max_users)

    return users_by_country


def build_country_info(users_by_country, display_number_users=False):
    country_data = {}
    for country in pycountry.countries:
        country_info = users_by_country.get(country.alpha_2)
        number_of_users = 0
        percentage_of_users = 0
        color_rgb = [247, 247, 247]
        if country_info is not None:
            if display_number_users:
                number_of_users = country_info['number_of_users'] or 0
            percentage_of_users = country_info['percentage_of_users'] or 0
            color_rgb = country_info['color_rgb'] or [247, 247, 247]

        # Use common_name if available to be less political offending (#310)
        try:
            country_name = country.common_name
        except AttributeError:
            country_name = country.name

        country_data[country.numeric] = {
            'name': country_name,
            'code': country.alpha_2,
            'percentage_of_users': percentage_of_users,
            'color_rgb': color_rgb
        }

        if display_number_users:
            country_data[country.numeric]['number_of_users'] = number_of_users

    return country_data


def normalize_searched_snaps(search_results):
    return (
        search_results['_embedded']['clickindex:package']
        if '_embedded' in search_results
        else []
    )


def get_pages_details(links):
    links_result = {}

    if('first' in links):
        links_result['first'] = convert_limit_offset_to_size_page(
            links['first']['href']
        )

    if('last' in links):
        links_result['last'] = convert_limit_offset_to_size_page(
            links['last']['href']
        )

    if('next' in links):
        links_result['next'] = convert_limit_offset_to_size_page(
            links['next']['href']
        )

    if('prev' in links):
        links_result['prev'] = convert_limit_offset_to_size_page(
            links['prev']['href']
        )

    if('self' in links):
        links_result['self'] = convert_limit_offset_to_size_page(
            links['self']['href']
        )

    return links_result


def convert_limit_offset_to_size_page(link):
    url_parsed = urlparse(link)
    host_url = (
        "{base_url}"
        "?q={q}&limit={limit}&offset={offset}"
    )

    url_queries = parse_qs(url_parsed.query)
    q = url_queries['q'][0]
    size = int(url_queries['size'][0])
    page = int(url_queries['page'][0])

    return host_url.format(
        base_url=flask.request.base_url,
        q=q,
        limit=size,
        offset=size*(page-1)
    )


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

    return status_code, error


def homepage():
    featured_snaps = []
    error_info = {}
    status_code = 200
    try:
        featured_snaps = normalize_searched_snaps(api.get_featured_snaps())
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
        featured_snaps = normalize_searched_snaps(api.get_featured_snaps())
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
        promoted_snaps = normalize_searched_snaps(api.get_promoted_snaps())
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
    if(not snap_searched):
        return flask.redirect('/store')

    size = flask.request.args.get('limit', default=10, type=int)
    offset = flask.request.args.get('offset', default=0, type=int)

    page = floor(offset / size) + 1

    error_info = {}
    normalize_results = []
    links = []
    try:
        searched_results = api.get_searched_snaps(
            quote_plus(snap_searched),
            size,
            page
        )

        normalize_results = normalize_searched_snaps(searched_results)
        links = get_pages_details(
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
        "snaps": normalize_results,
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
    today = datetime.datetime.utcnow().date()
    week_ago = today - relativedelta.relativedelta(weeks=1)

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

    description = details['description'].strip()
    paragraphs = re.compile(r'[\n\r]{2,}').split(description)
    formatted_paragraphs = []

    # Sanitise paragraphs
    def external(attrs, new=False):
        url_parts = urlparse(attrs[(None, "href")])
        if url_parts.netloc and url_parts.netloc != 'snapcraft.io':
            if (None, "class") not in attrs:
                attrs[(None, "class")] = "p-link--external"
            elif "p-link--external" not in attrs[(None, "class")]:
                attrs[(None, "class")] += " p-link--external"
        return attrs

    for paragraph in paragraphs:
        callbacks = bleach.linkifier.DEFAULT_CALLBACKS
        callbacks.append(external)

        paragraph = bleach.clean(paragraph, tags=[])
        paragraph = bleach.linkify(paragraph, callbacks=callbacks)

        formatted_paragraphs.append(paragraph.replace('\n', '<br />'))

    status_code = 200
    country_data = []
    try:
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

        users_by_country = normalize_metrics(
            metrics_response[0]['series']
        )
        country_data = build_country_info(users_by_country)
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
