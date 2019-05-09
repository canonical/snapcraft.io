import datetime
import re
from urllib.parse import parse_qs, urlparse

import humanize
from dateutil import parser


def get_searched_snaps(search_results):
    """Get search snaps from API response

    :param search_results: the body responsed by the API

    :returns: The list of the searched snaps
    """
    return (
        search_results["_embedded"]["clickindex:package"]
        if "_embedded" in search_results
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

    if "first" in links:
        links_result["first"] = convert_navigation_url(
            url, links["first"]["href"]
        )

    if "last" in links:
        links_result["last"] = convert_navigation_url(
            url, links["last"]["href"]
        )

    if "next" in links:
        links_result["next"] = convert_navigation_url(
            url, links["next"]["href"]
        )

    if "prev" in links:
        links_result["prev"] = convert_navigation_url(
            url, links["prev"]["href"]
        )

    if "self" in links:
        links_result["self"] = convert_navigation_url(
            url, links["self"]["href"]
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
    host_url = "{base_url}" "?q={q}&limit={limit}&offset={offset}"

    url_queries = parse_qs(url_parsed.query)

    if "q" in url_queries:
        q = url_queries["q"][0]
    else:
        q = ""

    if "section" in url_queries:
        category = url_queries["section"][0]
    else:
        category = ""

    size = int(url_queries["size"][0])
    page = int(url_queries["page"][0])

    url = host_url.format(
        base_url=url, q=q, limit=size, offset=size * (page - 1)
    )

    if category != "":
        url += "&category=" + category

    return url


def build_pagination_link(snap_searched, snap_category, page):
    """Build pagination link

    :param snap_searched: Name of the search query
    :param snap_category: The category being searched in
    :param page: The page of results

    :returns: A url string
    """
    params = []

    if snap_searched:
        params.append("q=" + snap_searched)

    if snap_category:
        params.append("category=" + snap_category)

    if page:
        params.append("page=" + str(page))

    return "/search?" + "&".join(params)


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
        arch = channel.get("channel").get("architecture")
        track = channel.get("channel").get("track")
        if arch not in channel_map_restruct:
            channel_map_restruct[arch] = {}
        if track not in channel_map_restruct[arch]:
            channel_map_restruct[arch][track] = []

        info = {
            "created-at": convert_date(channel.get("created-at")),
            "version": channel.get("version"),
            "channel": channel.get("channel").get("name"),
            "risk": channel.get("channel").get("risk"),
            "confinement": channel.get("confinement"),
            "size": channel.get("download").get("size"),
        }
        channel_map_restruct[arch][track].append(info)

    return channel_map_restruct


def convert_date(date_to_convert):
    """Convert date to human readable format: Month Day Year

    If date is less than a day return: today or yesterday

    Format of date to convert: 2019-01-12T16:48:41.821037+00:00
    Output: Jan 12 2019

    :param date_to_convert: Date to convert
    :returns: Readable date
    """
    date_parsed = parser.parse(date_to_convert).replace(tzinfo=None)
    delta = datetime.datetime.now() - datetime.timedelta(days=1)
    if delta < date_parsed:
        return humanize.naturalday(date_parsed).title()
    else:
        return date_parsed.strftime("%-d %B %Y")


categories_list = [
    "development",
    "games",
    "social",
    "productivity",
    "utilities",
    "photo-and-video",
    "server-and-cloud",
    "security",
    "devices-and-iot",
    "music-and-audio",
    "entertainment",
    "art-and-design",
]

blacklist = ["featured"]


def get_categories(categories_json):
    """Retrieve and flatten the nested array from the legacy API response.

    :param categories_json: The returned json
    :returns: A list of categories
    """

    categories = []

    if "_embedded" in categories_json:
        for cat in categories_json["_embedded"]["clickindex:sections"]:
            if (
                cat["name"] not in categories_list
                and cat["name"] not in blacklist
            ):
                categories_list.append(cat["name"])

        for category in categories_list:
            categories.append(
                {
                    "slug": category,
                    "name": category.capitalize().replace("-", " "),
                }
            )

    return categories


def get_snap_categories(snap_categories):
    """Retrieve list of categories with names for a snap.

    :param snap_categories: List of snap categories from snap info API
    :returns: A list of categories with names
    """
    categories = []

    for cat in snap_categories:
        if cat["name"] not in blacklist:
            categories.append(
                {
                    "slug": cat["name"],
                    "name": cat["name"].capitalize().replace("-", " "),
                }
            )

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
            if channel_map["channel"]["risk"] == "stable":
                newest_channel = channel_map

        if newest_channel["channel"]["risk"] == "stable":
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
                    if release["risk"] == "stable":
                        return True

    return False


def get_lowest_available_risk(channel_map, track):
    """Get the lowest available risk for the default track

    :param channel_map: Channel map list
    :param track: The track of the channel

    :returns: The lowest available risk
    """
    risk_order = ["stable", "candidate", "beta", "edge"]
    lowest_available_risk = None
    for arch in channel_map:
        if arch in channel_map and track in channel_map[arch]:
            releases = channel_map[arch][track]
            for release in releases:
                if not lowest_available_risk:
                    lowest_available_risk = release["risk"]
                else:
                    risk_index = risk_order.index(release["risk"])
                    lowest_index = risk_order.index(lowest_available_risk)
                    if risk_index < lowest_index:
                        lowest_available_risk = release["risk"]

    return lowest_available_risk


def get_confinement(channel_map, track, risk):
    """Get the confinement for a channel

    :param channel_map: Channel map list
    :param track: The track of the channel
    :param risk: The risk of the channel

    :returns: The confinement
    """
    for arch in channel_map:
        if track in channel_map[arch]:
            releases = channel_map[arch][track]
            for release in releases:
                if release["risk"] == risk:
                    return release["confinement"]

    return None


def get_version(channel_map, track, risk):
    """Get the version for a channel

    :param channel_map: Channel map list
    :param track: The track of the channel
    :param risk: The risk of the channel

    :returns: The version
    """
    for arch in channel_map:
        if track in channel_map[arch]:
            releases = channel_map[arch][track]
            for release in releases:
                if release["risk"] == risk:
                    return release["version"]

    return None


def get_video_embed_code(url):
    """Get the embed code for videos

    :param url: The url of the video

    :returns: Embed code
    """
    if "youtube" in url:
        return {
            "type": "youtube",
            "url": url.replace("watch?v=", "embed/"),
            "id": url.rsplit("?v=", 1)[-1],
        }
    if "vimeo" in url:
        return {
            "type": "vimeo",
            "url": url.replace("vimeo.com/", "player.vimeo.com/video/"),
            "id": url.rsplit("/", 1)[-1],
        }
    if "asciinema" in url:
        return {
            "type": "asciinema",
            "url": url + ".js",
            "id": url.rsplit("/", 1)[-1],
        }


def filter_screenshots(media):
    banner_regex = r"/banner(\-icon)?(_.*)?\.(png|jpg)"

    return [
        m["url"]
        for m in media
        if m["type"] == "screenshot" and not re.search(banner_regex, m["url"])
    ][:5]


def get_icon(media):
    return [m["url"] for m in media if m["type"] == "icon"]


def get_videos(media):
    return [
        get_video_embed_code(m["url"]) for m in media if m["type"] == "video"
    ]


def promote_snap_with_icon(snaps):
    """Move the first snap with an icon to the front of the list

    :param snaps: The list of snaps

    :returns: A list of snaps
    """
    snap_with_icon = next(snap for snap in snaps if snap["icon_url"] != "")

    if snap_with_icon:
        snap_with_icon_index = snaps.index(snap_with_icon)

        snaps.insert(0, snaps.pop(snap_with_icon_index))

    return snaps
