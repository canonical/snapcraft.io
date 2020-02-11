import flask
import math

from canonicalwebteam.discourse_docs import (
    DiscourseAPI,
    DiscourseDocs,
    DocParser,
)


def init_tutorials(app, url_prefix):
    discourse_parser = DocParser(
        api=DiscourseAPI(base_url="https://discourse.ubuntu.com/"),
        index_topic_id=13611,
        category_id=34,
        url_prefix=url_prefix,
    )
    discourse_docs = DiscourseDocs(
        parser=discourse_parser,
        document_template="tutorials/tutorial.html",
        url_prefix=url_prefix,
        blueprint_name="tutorials",
    )

    @app.route(url_prefix)
    def index():
        page = flask.request.args.get("page", default=1, type=int)
        topic = flask.request.args.get("topic", default=None, type=str)
        sort = flask.request.args.get("sort", default=None, type=str)
        posts_per_page = 15
        discourse_docs.parser.parse()
        if not topic:
            metadata = discourse_docs.parser.metadata
        else:
            metadata = [
                doc
                for doc in discourse_docs.parser.metadata
                if topic in doc["categories"]
            ]

        if sort == "difficulty-desc":
            metadata = sorted(
                metadata, key=lambda k: k["difficulty"], reverse=True
            )

        if sort == "difficulty-asc" or not sort:
            metadata = sorted(
                metadata, key=lambda k: k["difficulty"], reverse=False
            )

        total_pages = math.ceil(len(metadata) / posts_per_page)

        return flask.render_template(
            "tutorials/index.html",
            navigation=discourse_docs.parser.navigation,
            forum_url=discourse_docs.parser.api.base_url,
            metadata=metadata,
            page=page,
            topic=topic,
            sort=sort,
            posts_per_page=posts_per_page,
            total_pages=total_pages,
            page_slug="tutorials",
        )

    discourse_docs.init_app(app)
