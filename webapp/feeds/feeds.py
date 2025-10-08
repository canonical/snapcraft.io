import flask
import requests
from datetime import datetime, timezone
from flask import Response
from feedgen.feed import FeedGenerator
from requests import Session
from html import escape
from urllib.parse import urlparse

feeds = flask.Blueprint(
    "feeds",
    __name__,
)

session = Session()


def is_safe_url(url):
    """Check if URL is safe (http/https only)."""
    if not url:
        return False
    try:
        parsed = urlparse(url)
        return parsed.scheme in ("http", "https") and parsed.netloc
    except Exception:
        return False


def parse_snap_date(date_string):
    """Parse date string from API to datetime object."""
    try:
        dt = datetime.strptime(date_string, "%a, %d %b %Y %H:%M:%S %Z")
        return dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return datetime.now(timezone.utc)


def create_snap_description(snap):
    """Create HTML description for RSS item."""
    description_parts = []

    if snap.get("icon") and is_safe_url(snap["icon"]):
        icon_url = escape(snap["icon"])
        description_parts.append(f'<img src="{icon_url}" alt="Snap icon">')

    if snap.get("summary"):
        summary = escape(snap["summary"])
        description_parts.append(f"<p>{summary}</p>")

    additional_info = []

    if snap.get("publisher"):
        publisher = escape(snap["publisher"])
        additional_info.append(f"<li>Developer: {publisher}</li>")

    if snap.get("version"):
        version = escape(snap["version"])
        additional_info.append(f"<li>Version: {version}</li>")

    if additional_info:
        description_parts.append("<ul>" + "".join(additional_info) + "</ul>")

    if snap.get("media"):
        for media in snap["media"]:
            if (
                media.get("type") == "screenshot"
                and media.get("url")
                and is_safe_url(media["url"])
            ):
                media_url = escape(media["url"])
                description_parts.append(
                    f'<img src="{media_url}" alt="Screenshot">'
                )

    return "".join(description_parts)


@feeds.route("/feeds/updates")
def recently_updated_feed():
    """Generate RSS feed for recently updated snaps."""

    fg = FeedGenerator()
    fg.title("Snapcraft - recently updated snaps")
    fg.link(href="https://snapcraft.io/store", rel="alternate")
    fg.description("Recently updated snaps published on Snapcraft")
    fg.language("en")
    fg.docs("http://www.rssboard.org/rss-specification")
    fg.generator("python-feedgen")

    size = int(flask.request.args.get("size", "50"))

    page = int(flask.request.args.get("page", "1"))

    try:
        api_url = flask.current_app.config.get(
            "RECOMMENDATION_API_URL",
            "https://recommendations.snapcraft.io/api/recently-updated",
        )
        params = {"size": size, "page": page}
        response = session.get(api_url, params=params, timeout=10)
        response.raise_for_status()

        data = response.json()
        snaps = data.get("snaps", [])

    except (requests.RequestException, ValueError) as e:
        flask.current_app.logger.error(f"Failed to fetch recommendations: {e}")
        snaps = []

    for snap in snaps:
        try:
            fe = fg.add_entry()

            title = escape(snap.get("title"))

            fe.title(title)

            snap_name = snap.get("name")
            snap_url = f"https://snapcraft.io/{snap_name}"
            fe.link(href=snap_url)

            description = create_snap_description(snap)
            fe.description(description)

            pub_date = parse_snap_date(snap["last_updated"])
            fe.pubDate(pub_date)

        except Exception as e:
            flask.current_app.logger.error(
                f"Failed to add snap to RSS feed: {e}"
            )
            continue

    rss_str = fg.rss_str(pretty=True)

    response = Response(rss_str, mimetype="application/rss+xml")
    response.headers["Cache-Control"] = "public, max-age=86400"

    return response
