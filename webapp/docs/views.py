import talisker

from canonicalwebteam.discourse_docs import (
    DiscourseAPI,
    DiscourseDocs,
    DocParser,
)
from canonicalwebteam.search import build_search_view


def init_docs(app, url_prefix):
    discourse_docs = DiscourseDocs(
        parser=DocParser(
            api=DiscourseAPI(
                base_url="https://forum.snapcraft.io/",
                session=talisker.requests.get_session(),
            ),
            index_topic_id=11127,
            url_prefix=url_prefix,
        ),
        document_template="docs/document.html",
        url_prefix=url_prefix,
    )

    discourse_docs.init_app(app)

    app.add_url_rule(
        "/docs/search",
        "docs-search",
        build_search_view(
            site="snapcraft.io/docs", template_path="docs/search.html"
        ),
    )
