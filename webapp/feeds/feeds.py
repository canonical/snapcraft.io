import flask
import requests
import talisker.requests
from datetime import datetime, timezone
from flask import Response
from feedgen.feed import FeedGenerator
from requests import Session

feeds = flask.Blueprint(
    "feeds",
    __name__,
)

session = Session()


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
    
    if snap.get("icon"):
        description_parts.append(f'<img src="{snap["icon"]}">')
    
    if snap.get("summary"):
        description_parts.append(f"<p>{snap['summary']}</p>")
    
    if snap.get("description"):
        desc_html = snap["description"].replace("\n", "<br>")
        description_parts.append(f"<p>{desc_html}</p>")
    
    additional_info = []
    if snap.get("publisher"):
        additional_info.append(f"<li>Developer: {snap['publisher']}</li>")
    if snap.get("version"):
        additional_info.append(f"<li>Version: {snap['version']}</li>")
    
    if additional_info:
        description_parts.append("<ul>" + "".join(additional_info) + "</ul>")
    
    if snap.get("media"):
        for media in snap["media"]:
            if media.get("type") == "screenshot" and media.get("url"):
                description_parts.append(f'<img src="{media["url"]}">')
    
    return "".join(description_parts)


@feeds.route("/feeds/updates")
def recently_updated_feed():
    """Generate RSS feed for recently updated snaps."""
    
    fg = FeedGenerator()
    fg.title('Snapcraft - recently updated Snaps')
    fg.link(href='https://snapcraft.io/store', rel='alternate')
    fg.description('Recently updated Snaps published on Snapcraft')
    fg.language('en')
    fg.docs('http://www.rssboard.org/rss-specification')
    fg.generator('python-feedgen')

    # can take in size and page parameters
    size = flask.request.args.get('size', '50')
    page = flask.request.args.get('page', '1')
    
    try:
        api_url = flask.current_app.config.get('RECOMMENDATION_API_URL', 'https://recommendations.snapcraft.io/api/recently-updated')
        params = {'size': size, 'page': page}
        response = session.get(api_url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        snaps = data.get("snaps", [])
        
    except (requests.RequestException, ValueError) as e:
        # Log the error and return an empty feed
        flask.current_app.logger.error(f"Failed to fetch recommendations: {e}")
        snaps = []
    
    # Add feed entries
    for snap in snaps:
        try:
            fe = fg.add_entry()
            
            title = snap.get("title")
            fe.title(title)
            
            snap_name = snap.get("name", "")
            snap_url = f"https://snapcraft.io/{snap_name}"
            fe.link(href=snap_url)
            
            # Set description
            description = create_snap_description(snap)
            fe.description(description)
            
            if snap.get("last_updated"):
                pub_date = parse_snap_date(snap["last_updated"])
                fe.pubDate(pub_date)
            else:
                fe.pubDate(datetime.now(timezone.utc))
            
        except Exception as e:
            flask.current_app.logger.error(f"Failed to add snap to RSS feed: {e}")
            raise
            # continue
    
    rss_str = fg.rss_str(pretty=True)
    
    response = Response(rss_str, mimetype='application/rss+xml')
    response.headers['Cache-Control'] = 'public, max-age=86400'
    
    return response