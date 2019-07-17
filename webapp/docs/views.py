import flask

from canonicalwebteam.discourse_docs import (
    DiscourseAPI,
    DiscourseDocs,
    DocParser,
)
from webapp.api.google import get_search_results


def init_docs(app, url_prefix):
    discourse_index_id = 11127
    discourse_api = DiscourseAPI(base_url="https://forum.snapcraft.io/")
    discourse_parser = DocParser(discourse_api, discourse_index_id, url_prefix)
    discourse_docs = DiscourseDocs(
        parser=discourse_parser,
        category_id=15,
        document_template="docs/document.html",
        url_prefix=url_prefix,
    )

    @discourse_docs.blueprint.route("/search")
    def search():
        """
        Get search results from Google Custom Search
        """
        search_api_key = flask.current_app.config["SEARCH_API_KEY"]
        search_api_url = flask.current_app.config["SEARCH_API_URL"]
        search_custom_id = flask.current_app.config["SEARCH_CUSTOM_ID"]

        query = flask.request.args.get("q")
        num = int(flask.request.args.get("num", "10"))
        start = int(flask.request.args.get("start", "1"))

        context = {"query": query, "start": start, "num": num}

        if query:
            context["results"] = get_search_results(
                search_api_key,
                search_api_url,
                search_custom_id,
                query,
                start,
                num,
            )

        return flask.render_template("docs/search.html", **context)

    discourse_docs.init_app(app)
