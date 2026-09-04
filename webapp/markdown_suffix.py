"""
Serve /page.md as the Markdown rendering of /page.

canonicalwebteam.markdown-response is worked with a query parameter but
the llms.txt spec asks for a .md suffix. Flask matches the URL before any
request hook runs, so /about.md would 404 before we could rewrite it so
the rewrite has to happen at the WSGI layer instead.

QUERY_PARAM is internal so .md is the only public way to ask for Markdown.
"""

SUFFIX = ".md"
INDEX = "index" + SUFFIX
QUERY_PARAM = "_markdown"
QUERY_VALUE = "1"


CACHE_CONTROL = (
    "public, max-age=3600, stale-while-revalidate=86400, "
    "stale-if-error=86400"
)


class MarkdownSuffix:
    def __init__(self, app):
        self.wsgi_app = app.wsgi_app
        app.wsgi_app = self
        app.after_request(cache_markdown)

    def __call__(self, environ, start_response):
        path = environ.get("PATH_INFO", "")

        if path.endswith(SUFFIX):
            environ["PATH_INFO"] = strip_suffix(path)
            param = f"{QUERY_PARAM}={QUERY_VALUE}"
            query = environ.get("QUERY_STRING", "")
            environ["QUERY_STRING"] = f"{query}&{param}" if query else param

        return self.wsgi_app(environ, start_response)


def cache_markdown(response):
    if response.mimetype == "text/markdown":
        response.headers["Cache-Control"] = "private, max-age=3600"

    return response


def is_markdown_request(request):
    return request.args.get(QUERY_PARAM) == QUERY_VALUE


def add_suffix(path):
    # The spec asks for index.md on URLs without a file name.
    if path.endswith("/"):
        return path + INDEX

    return path + SUFFIX


def strip_suffix(path):
    if path.endswith("/" + INDEX):
        return path[: -len(INDEX)]

    return path[: -len(SUFFIX)] or "/"
