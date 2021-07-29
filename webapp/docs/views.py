import talisker

from canonicalwebteam.discourse import (
    DiscourseAPI,
    DocParser,
    Docs,
)
from canonicalwebteam.search import build_search_view


def init_docs(app, url_prefix):
    session = talisker.requests.get_session()
    discourse_docs = Docs(
        parser=DocParser(
            api=DiscourseAPI(
                base_url="https://forum.snapcraft.io/", session=session
            ),
            index_topic_id=25750,
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
            session=session,
            site="snapcraft.io/docs",
            template_path="docs/search.html",
        ),
    )
