import bleach
from math import floor
import pycountry
import re
from urllib.parse import parse_qs, urlparse


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


def get_pages_details(url, links):
    links_result = {}

    if('first' in links):
        links_result['first'] = convert_limit_offset_to_size_page(
            url,
            links['first']['href']
        )

    if('last' in links):
        links_result['last'] = convert_limit_offset_to_size_page(
            url,
            links['last']['href']
        )

    if('next' in links):
        links_result['next'] = convert_limit_offset_to_size_page(
            url,
            links['next']['href']
        )

    if('prev' in links):
        links_result['prev'] = convert_limit_offset_to_size_page(
            url,
            links['prev']['href']
        )

    if('self' in links):
        links_result['self'] = convert_limit_offset_to_size_page(
            url,
            links['self']['href']
        )

    return links_result


def convert_limit_offset_to_size_page(url, link):
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
        base_url=url,
        q=q,
        limit=size,
        offset=size*(page-1)
    )


def format_paragraphs(unformatted_description):
    description = unformatted_description.strip()
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

    return formatted_paragraphs


def convert_args_search(limit, offset):
    page = floor(offset / limit) + 1

    return (limit, page)
