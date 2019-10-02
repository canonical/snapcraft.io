import flask

from canonicalwebteam.blog import BlogViews, logic, wordpress_api
from canonicalwebteam.blog.flask import build_blueprint


def init_blog(app, url_prefix):
    blog = build_blueprint(
        BlogViews(blog_title="Snapcraft Blog", tag_ids=[2996])
    )

    @blog.route("/api/snap-posts/<snap>")
    def snap_posts(snap):
        try:
            blog_tags = wordpress_api.get_tag_by_name(f"sc:snap:{snap}")
        except Exception:
            blog_tags = None

        blog_articles = None
        articles = []

        if blog_tags:
            try:
                blog_articles, total_pages = wordpress_api.get_articles(
                    blog_tags["id"], 3
                )
            except Exception:
                blog_articles = []

            for article in blog_articles:
                transformed_article = logic.transform_article(
                    article, featured_image=None, author=None
                )
                articles.append(
                    {
                        "slug": transformed_article["slug"],
                        "title": transformed_article["title"]["rendered"],
                    }
                )

        return flask.jsonify(articles)

    @blog.route("/api/series/<series>")
    def snap_series(series):
        blog_articles = None
        articles = []

        try:
            blog_articles, total_pages = wordpress_api.get_articles(series)
        except Exception:
            blog_articles = []

        for article in blog_articles:
            transformed_article = logic.transform_article(
                article, featured_image=None, author=None
            )
            articles.append(
                {
                    "slug": transformed_article["slug"],
                    "title": transformed_article["title"]["rendered"],
                }
            )

        return flask.jsonify(articles)

    @blog.context_processor
    def add_newsletter():
        newsletter_subscribed = flask.request.args.get(
            "newsletter", default=False, type=bool
        )

        return {"newsletter_subscribed": newsletter_subscribed}

    app.register_blueprint(blog, url_prefix=url_prefix)
