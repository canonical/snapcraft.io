import flask
import talisker

from canonicalwebteam import image_template
from canonicalwebteam.blog import (
    BlogViews,
    BlogAPI,
    build_blueprint,
    NotFoundError,
)
from dateutil import parser
from requests.exceptions import RequestException


def init_blog(app, url_prefix):
    session = talisker.requests.get_session()
    blog_api = BlogAPI(
        session=session,
        thumbnail_width=354,
        thumbnail_height=199,
    )
    blog = build_blueprint(
        BlogViews(
            api=blog_api,
            blog_title="Snapcraft Blog",
            tag_ids=[2996],
            excluded_tags=[3184, 3265, 3408],
        )
    )

    @blog.route("/api/snap-posts/<snap>")
    def snap_posts(snap):
        try:
            blog_tags = blog_api.get_tag_by_name(f"sc:snap:{snap}")
        except NotFoundError:
            blog_tags = None

        blog_articles = None
        articles = []

        if blog_tags:
            snapcraft_tag = blog_api.get_tag_by_name("snapcraft.io")

            try:
                blog_articles, total_pages = blog_api.get_articles(
                    tags=blog_tags["id"],
                    tags_exclude=[3184, 3265, 3408],
                    per_page=3 - len(articles),
                )
            except RequestException:
                blog_articles = []

            for article in blog_articles:
                if article["image"]:
                    featured_media = image_template(
                        url=article["image"]["source_url"],
                        alt="",
                        width="346",
                        height="231",
                        fill=True,
                        hi_def=True,
                        loading="auto",
                    )
                else:
                    featured_media = None

                url = f"/blog/{article['slug']}"

                if snapcraft_tag["id"] not in article["tags"]:
                    url = f"https://ubuntu.com{url}"

                articles.append(
                    {
                        "slug": url,
                        "title": article["title"]["rendered"],
                        "image": featured_media,
                    }
                )

        return flask.jsonify(articles)

    @blog.route("/api/series/<series>")
    def snap_series(series):
        blog_articles = None
        articles = []

        try:
            blog_articles, total_pages = blog_api.get_articles(series)
        except RequestException:
            blog_articles = []

        for article in blog_articles:
            articles.append(
                {
                    "slug": article["slug"],
                    "title": article["title"]["rendered"],
                }
            )

        return flask.jsonify(articles)

    @blog.context_processor
    def add_newsletter():
        newsletter_subscribed = flask.request.args.get(
            "newsletter", default=False, type=bool
        )

        return {"newsletter_subscribed": newsletter_subscribed}

    @blog.route("/sitemap.xml")
    def sitemap():
        base_url = "https://snapcraft.io/blog"
        links = []
        page = 1
        while True:
            url = (
                f"https://ubuntu.com/blog/wp-json/wp/v2/posts?"
                f"tags=2996&per_page=100&page={page}"
                f"&tags_exclude=3184%2C3265%2C3408"
            )

            response = session.get(url)
            if response.status_code == 400:
                break

            try:
                blog_response = response.json()
            except Exception:
                continue

            for post in blog_response:
                try:
                    date = (
                        parser.parse(post["date"])
                        .replace(tzinfo=None)
                        .strftime("%Y-%m-%d")
                    )
                    links.append(
                        {
                            "url": base_url + "/" + post["slug"],
                            "last_udpated": date,
                        }
                    )
                except Exception:
                    continue

            page = page + 1

        xml_sitemap = flask.render_template(
            "sitemap/sitemap.xml",
            base_url=base_url,
            links=links,
        )

        response = flask.make_response(xml_sitemap)
        response.headers["Content-Type"] = "application/xml"
        response.headers["Cache-Control"] = "public, max-age=43200"

        return response

    app.register_blueprint(blog, url_prefix=url_prefix)
