import flask

import webapp.api.blog as api
from webapp.api.exceptions import ApiError, ApiCircuitBreaker
from webapp.blog import logic

blog = flask.Blueprint(
    "blog", __name__, template_folder="/templates", static_folder="/static"
)


@blog.route("/")
def homepage():
    BLOG_CATEGORIES_ENABLED = (
        flask.current_app.config["BLOG_CATEGORIES_ENABLED"] == "true"
    )

    page_param = flask.request.args.get("page", default=1, type=int)

    # Feature flag
    if BLOG_CATEGORIES_ENABLED:
        filter = flask.request.args.get("filter", default=None, type=str)

        if filter == "all":
            filter = None

        try:
            categories_list = api.get_categories()
        except ApiError:
            categories_list = []

        categories = logic.whitelist_categories(categories_list)

        filter_category = next(
            (
                item["id"]
                for item in categories
                if item["name"].lower() == filter
            ),
            None,
        )
    else:
        filter_category = None
        categories = None
        filter = None

    try:
        # Anything after page 1 needs to be offset by the page -11
        # because the newsletter takes a spot on the first page
        # The only way to do this with wordpress is to set a specific
        # item offset `offset` from the start of the collection
        get_page = 1
        page_offset = 0

        if page_param > 1:
            get_page = 1
            page_offset = (12 * (page_param - 1)) - 1

        articles, total_pages = api.get_articles(
            page=get_page, category=filter_category, offset=page_offset
        )
    except ApiCircuitBreaker:
        return flask.abort(503)
    except ApiError as api_error:
        return flask.abort(502, str(api_error))

    category_cache = {}

    for article in articles:
        try:
            featured_image = article["_embedded"]["wp:featuredmedia"][0]
        except (IndexError, KeyError):
            featured_image = None

        try:
            author = article["_embedded"]["author"][0]
        except (IndexError, KeyError):
            author = None

        # Feature flag
        if BLOG_CATEGORIES_ENABLED:
            category_ids = article["categories"]

            for category_id in category_ids:
                if category_id not in category_cache:
                    category_cache[category_id] = {}

        article = logic.transform_article(
            article, featured_image=featured_image, author=author
        )

    # Feature flag
    if BLOG_CATEGORIES_ENABLED:
        for key, category in category_cache.items():
            try:
                resolved_category = api.get_category_by_id(key)
            except ApiError:
                resolved_category = None

            category_cache[key] = resolved_category

    if page_param == 1 and len(articles) > 2:
        articles.insert(2, "newsletter")
        if len(articles) == 13:
            articles.pop(12)

    newsletter_subscribed = flask.request.args.get(
        "newsletter", default=False, type=bool
    )

    context = {
        "current_page": page_param,
        "total_pages": int(total_pages),
        "articles": articles,
        "categories": categories,
        "used_categories": category_cache,
        "filter": filter,
        "newsletter_subscribed": newsletter_subscribed,
    }

    return flask.render_template("blog/index.html", **context)


@blog.route("/feed")
def feed():
    try:
        feed = api.get_feed()
    except ApiCircuitBreaker:
        return flask.abort(503)
    except ApiError:
        return flask.abort(502)

    right_urls = logic.change_url(
        feed, flask.request.base_url.replace("/feed", "")
    )

    right_title = right_urls.replace("Ubuntu Blog", "Snapcraft Blog")

    return flask.Response(right_title, mimetype="text/xml")


@blog.route(
    '/<regex("[0-9]{4}"):year>/<regex("[0-9]{2}"):month>/'
    '<regex("[0-9]{2}"):day>/<slug>'
)
@blog.route('/<regex("[0-9]{4}"):year>/<regex("[0-9]{2}"):month>/<slug>')
@blog.route('/<regex("[0-9]{4}"):year>/<slug>')
def article_redirect(slug, year, month=None, day=None):
    return flask.redirect(flask.url_for(".article", slug=slug))


@blog.route("/<slug>")
def article(slug):
    try:
        articles = api.get_article(slug)
    except ApiCircuitBreaker:
        return flask.abort(503)
    except ApiError as api_error:
        return flask.abort(502, str(api_error))

    if not articles:
        flask.abort(404, "Article not found")

    article = articles[0]

    try:
        author = article["_embedded"]["author"][0]
    except (IndexError, KeyError):
        author = None

    transformed_article = logic.transform_article(
        article, author=author, optimise_images=True
    )

    try:
        # Tags live in index 1 of wp:term
        tags = article["_embedded"]["wp:term"][1]
        tags = [{"id": tag["id"], "name": tag["name"]} for tag in tags]
    except (IndexError, KeyError):
        tags = []

    try:
        related_articles, total_pages = api.get_articles(
            tags=tags, per_page=3, exclude=article["id"]
        )
    except ApiError:
        related_articles = None

    if related_articles:
        for related_article in related_articles:
            related_article = logic.transform_article(related_article)

    newsletter_subscribed = flask.request.args.get(
        "newsletter", default=False, type=bool
    )

    context = {
        "article": transformed_article,
        "related_articles": related_articles,
        "tags": tags,
        "is_in_series": logic.is_in_series(tags),
        "newsletter_subscribed": newsletter_subscribed,
    }

    return flask.render_template("blog/article.html", **context)


@blog.route("/api/snap-posts/<snap>")
def snap_posts(snap):
    try:
        blog_tags = api.get_tag_by_name("".join(["sc:snap:", snap]))
    except ApiError:
        blog_tags = None

    blog_articles = None
    articles = []

    if blog_tags:
        blog_tags_ids = logic.get_tag_id_list(blog_tags, snap)

        if blog_tags_ids:
            try:
                blog_articles, total_pages = api.get_articles(blog_tags_ids, 3)
            except ApiError:
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
        blog_articles, total_pages = api.get_articles(series)
    except ApiError:
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
