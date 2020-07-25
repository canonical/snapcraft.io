import math

import flask
import talisker

from canonicalwebteam.discourse_docs import (
    DiscourseAPI,
    DiscourseDocs,
    DocParser,
)


def init_tutorials(app, url_prefix):
    discourse_docs = DiscourseDocs(
        parser=DocParser(
            api=DiscourseAPI(
                base_url="https://forum.snapcraft.io/",
                session=talisker.requests.get_session(),
            ),
            index_topic_id=15409,
            category_id=20,
            url_prefix=url_prefix,
        ),
        document_template="tutorials/tutorial.html",
        url_prefix=url_prefix,
        blueprint_name="tutorials",
    )

    @app.route(url_prefix)
    def tutorials():
        page = flask.request.args.get("page", default=1, type=int)
        posts_per_page = 12
        discourse_docs.parser.parse()
        metadata = discourse_docs.parser.metadata
        total_pages = math.ceil(len(metadata) / posts_per_page)

        return flask.render_template(
            "tutorials/index.html",
            navigation=discourse_docs.parser.navigation,
            forum_url=discourse_docs.parser.api.base_url,
            metadata=metadata,
            page=page,
            posts_per_page=posts_per_page,
            total_pages=total_pages,
            page_slug="tutorials",
        )

    discourse_docs.init_app(app)
