import bleach
import re
from urllib.parse import parse_qs, urlparse


def get_searched_snaps(search_results):
    """Get search snaps from API response

    :param search_results: the body responsed by the API

    :returns: The list of the searched snaps
    """
    return (
        search_results['_embedded']['clickindex:package']
        if '_embedded' in search_results
        else []
    )


def get_pages_details(url, links):
    """Transform returned navigation links from search API from limit/offset
    to size/page

    :param url: The url to build
    :param links: The links returned by the API

    :returns: A dictionnary with all the navigation links
    """
    links_result = {}

    if('first' in links):
        links_result['first'] = convert_navigation_url(
            url,
            links['first']['href']
        )

    if('last' in links):
        links_result['last'] = convert_navigation_url(
            url,
            links['last']['href']
        )

    if('next' in links):
        links_result['next'] = convert_navigation_url(
            url,
            links['next']['href']
        )

    if('prev' in links):
        links_result['prev'] = convert_navigation_url(
            url,
            links['prev']['href']
        )

    if('self' in links):
        links_result['self'] = convert_navigation_url(
            url,
            links['self']['href']
        )

    return links_result


def convert_navigation_url(url, link):
    """Convert navigation link from offest/limit to size/page

    Example:
    - input: http://example.com?q=test&category=finance&size=10&page=3
    - output: http://example2.com?q=test&category=finance&limit=10&offset=30

    :param url: The new url
    :param link: The navigation url returned by the API

    :returns: The new navigation link
    """
    url_parsed = urlparse(link)
    host_url = (
        "{base_url}"
        "?q={q}&limit={limit}&offset={offset}"
    )

    url_queries = parse_qs(url_parsed.query)

    if 'q' in url_queries:
        q = url_queries['q'][0]
    else:
        q = ''

    if 'section' in url_queries:
        category = url_queries['section'][0]
    else:
        category = ''

    size = int(url_queries['size'][0])
    page = int(url_queries['page'][0])

    url = host_url.format(
        base_url=url,
        q=q,
        limit=size,
        offset=size*(page-1)
    )

    if category != '':
        url += '&category=' + category

    return url


def split_description_into_paragraphs(unformatted_description):
    """Split a long description into a set of paragraphs. We assume each
    paragraph is separated by 2 or more line-breaks in the description.

    :param unformatted_description: The paragraph to format

    :returns: The formatted paragraphs
    """
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


def convert_channel_maps(channel_map):
    """Converts channel maps list to format easier to manipulate

    Example:
    - Input:
    [
      {
        'architecture': 'arch'
        'map': [{'info': 'release', ...}, ...],
        'track': 'track 1'
      },
      ...
    ]
    - Output:
    {
      'arch': {
        'track 1': [{'info': 'release', ...}, ...],
        ...
      },
      ...
    }

    :param channel_maps_list: The channel maps list returned by the API

    :returns: The channel maps reshaped
    """
    channel_map_restruct = {}
    for channel in channel_map:
        arch = channel.get('channel').get('architecture')
        track = channel.get('channel').get('track')
        if arch not in channel_map_restruct:
            channel_map_restruct[arch] = {}
        if track not in channel_map_restruct[arch]:
            channel_map_restruct[arch][track] = []

        info = {
            'created-at': channel.get('created-at'),
            'version': channel.get('version'),
            'channel': channel.get('channel').get('name'),
            'risk': channel.get('channel').get('risk'),
            'confinement': channel.get('confinement'),
            'size': channel.get('download').get('size')
        }
        channel_map_restruct[arch][track].append(info)

    return channel_map_restruct


def get_categories(categories_json):
    """Retrieve and flatten the nested array from the legacy API response.

    :param categories_json: The returned json
    :returns: A list of categories
    """
    categories_list = ['featured', 'developers', 'games', 'social-networking']
    categories = []

    if '_embedded' in categories_json:
        for cat in categories_json['_embedded']['clickindex:sections']:
            if cat['name'] not in categories_list:
                categories_list.append(cat['name'])

        for category in categories_list:
            categories.append({
                'slug': category,
                'name': category.capitalize().replace('-', ' ')
            })

    return categories


def get_last_updated_version(channel_maps):
    """Get the oldest channel that was created

    :param channel_map: Channel map list

    :returns: The latest stable version, if no stable, the latest risk updated
    """
    newest_channel = None
    for channel_map in channel_maps:
        if not newest_channel:
            newest_channel = channel_map
        else:
            if channel_map['channel']['risk'] == 'stable':
                newest_channel = channel_map

        if newest_channel['channel']['risk'] == 'stable':
            break

    return newest_channel


def has_stable(channel_maps_list):
    """Use the channel map to find out if the snap has a stable release

    :param channel_maps_list: Channel map list

    :returns: True or False
    """
    if channel_maps_list:
        for arch in channel_maps_list:
            for track in channel_maps_list[arch]:
                for release in channel_maps_list[arch][track]:
                    if release['risk'] == 'stable':
                        return True

    return False


def get_lowest_available_risk(channel_map, default_track):
    """Get the lowest available risk for the default track

    :param channel_map: Channel map list

    :returns: The lowest available risk
    """
    risk_order = ['stable', 'candidate', 'beta', 'edge']
    lowest_available_risk = None
    for arch in channel_map:
        if channel_map[arch][default_track]:
            releases = channel_map[arch][default_track]
            for release in releases:
                if not lowest_available_risk:
                    lowest_available_risk = release['risk']
                else:
                    risk_index = risk_order.index(release['risk'])
                    lowest_index = risk_order.index(lowest_available_risk)
                    if risk_index < lowest_index:
                        lowest_available_risk = release['risk']

    return lowest_available_risk
