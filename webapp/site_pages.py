"""
Discover the public pages of the site from the routing table.

llms.txt and the sitemap are both built from this. So a new
page shows up in both without any maintenance. A page
is included when its route takes no URL parameters, it is not behind login,
its view renders an HTML template rather than a redirect and that template
does not ask robots to skip it.

Titles and descriptions come from the meta_title and meta_description.
A page opts out by carrying a noindex robots tag, the same signal that
keeps it out of search results.
"""

import ast
import html
import inspect
import re
import textwrap
from collections import defaultdict

from jinja2 import nodes

from webapp.markdown_suffix import add_suffix

BASE_URL = "https://snapcraft.io"

SITE_NAME = "Snapcraft"

# Sections are keyed by the first segment of the path. A new page under
# a known area files itself
SECTION_LABELS = {
    "": "Main pages",
    "about": "Publishing a snap",
    "account": "Publishing a snap",
    "docs": "Documentation",
    "tutorials": "Documentation",
    "store": "Store",
    "blog": "Blog",
}

OTHER_SECTION = "Other pages"

SECTION_ORDER = [
    "Main pages",
    "Publishing a snap",
    "Documentation",
    "Store",
    "Store categories",
    "Blog",
    OTHER_SECTION,
    "Optional",
]

# The store categories change rarely
STORE_CATEGORIES = [
    {"name": "art-and-design", "display_name": "Art and Design"},
    {"name": "books-and-reference", "display_name": "Books and Reference"},
    {"name": "development", "display_name": "Development"},
    {"name": "devices-and-iot", "display_name": "Devices and IoT"},
    {"name": "education", "display_name": "Education"},
    {"name": "entertainment", "display_name": "Entertainment"},
    {"name": "finance", "display_name": "Finance"},
    {"name": "games", "display_name": "Games"},
    {"name": "health-and-fitness", "display_name": "Health and Fitness"},
    {"name": "music-and-audio", "display_name": "Music and Audio"},
    {"name": "news-and-weather", "display_name": "News and Weather"},
    {"name": "personalisation", "display_name": "Personalisation"},
    {"name": "photo-and-video", "display_name": "Photo and Video"},
    {"name": "productivity", "display_name": "Productivity"},
    {"name": "science", "display_name": "Science"},
    {"name": "security", "display_name": "Security"},
    {"name": "server-and-cloud", "display_name": "Server and Cloud"},
    {"name": "social", "display_name": "Social"},
    {"name": "utilities", "display_name": "Utilities"},
]

# Links that cannot be discovered: pages rendered by an imported view
# whose template is chosen at runtime and resources hosted elsewhere.
EXTRA_LINKS = [
    {
        "section": "Documentation",
        "url": BASE_URL + "/docs/",
        "title": "Snap documentation",
        "description": (
            "Reference and explanation for snaps and snapd: confinement, "
            "interfaces, channels, and the daemon."
        ),
    },
    {
        "section": "Optional",
        "url": BASE_URL + "/llms-full.txt",
        "title": "Every page in one file",
        "description": (
            "The pages above concatenated as Markdown, for reading in "
            "one request rather than following each link."
        ),
    },
    {
        "section": "Optional",
        "url": BASE_URL + "/store/sitemap.xml",
        "title": "Snap sitemap",
        "description": (
            "Every snap page on the store. Large - for exhaustive "
            "crawling rather than reading."
        ),
    },
    {
        "section": "Documentation",
        "url": "https://documentation.ubuntu.com/snapcraft/stable/",
        "title": "Snapcraft documentation",
        "description": (
            "The build tool: snapcraft.yaml reference, plugins, bases, "
            "and how-to guides for packaging software."
        ),
    },
]

ROBOTS_NOINDEX = re.compile(
    r"""<meta[^>]+name=["']robots["'][^>]+noindex""", re.IGNORECASE
)


def is_login_gated(view):
    while view is not None:
        code = getattr(view, "__code__", None)

        if code is not None and code.co_name == "is_user_logged_in":
            return True

        view = getattr(view, "__wrapped__", None)

    return False


def _view_tree(view):
    try:
        source = textwrap.dedent(inspect.getsource(inspect.unwrap(view)))
        return ast.parse(source)
    except (OSError, TypeError, SyntaxError):
        return None


def _calls(tree):
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue

        if isinstance(node.func, ast.Attribute):
            yield node.func.attr, node
        elif isinstance(node.func, ast.Name):
            yield node.func.id, node


def _template_name(view):
    tree = _view_tree(view)

    if tree is None:
        return None

    for name, call in _calls(tree):
        if name == "redirect":
            return None

        if name != "render_template" or not call.args:
            continue

        first = call.args[0]

        if isinstance(first, ast.Constant) and isinstance(first.value, str):
            return first.value if first.value.endswith(".html") else None

    return None


def _is_layout(name):
    return name.rsplit("/", 1)[-1].startswith("_")


def _extends(env, source):
    for node in env.parse(source).find_all(nodes.Extends):
        if isinstance(node.template, nodes.Const):
            return node.template.value

    return None


def _source_chain(env, name):
    chain = []

    while name and not _is_layout(name):
        try:
            source = env.loader.get_source(env, name)[0]
        except Exception:
            break

        chain.append(source)
        name = _extends(env, source)

    return chain


def _static_block(env, source, block_name):
    for block in env.parse(source).find_all(nodes.Block):
        if block.name != block_name:
            continue

        return "".join(
            node.data for node in block.find_all(nodes.TemplateData)
        )

    return None


def _block(env, chain, block_name):
    for source in chain:
        text = _static_block(env, source, block_name)

        if text and text.strip():
            return _clean(text)

    return None


def _clean(text):
    text = html.unescape(re.sub(r"\s+", " ", text)).strip()

    return text.strip("|-–— ").strip()


def _title(text):
    parts = [part.strip() for part in text.split("|")]
    parts = [part for part in parts if part and part != SITE_NAME]

    return " | ".join(parts)


def _section(path):
    segments = [segment for segment in path.split("/") if segment]
    prefix = segments[0] if len(segments) > 1 else ""

    return SECTION_LABELS.get(prefix, OTHER_SECTION)


def _page(env, rule, view):
    template = _template_name(view)

    if template is None:
        return None

    chain = _source_chain(env, template)

    if not chain or any(ROBOTS_NOINDEX.search(source) for source in chain):
        return None

    title = _block(env, chain, "meta_title")

    if not title:
        return None

    path = rule.rule.rstrip("/") or "/"

    return {
        "path": path,
        "template": template,
        "title": _title(title),
        "description": _block(env, chain, "meta_description"),
        "section": _section(path),
    }


def _deduplicate(pages):
    """
    Pages sharing a template or a title are the same page reached by
    more than one route such as /store, /explore and /search. The
    shortest path is the one kept.
    """
    kept = []
    seen = set()

    for page in sorted(
        pages, key=lambda page: (len(page["path"]), page["path"])
    ):
        keys = {page.pop("template"), page["title"]}

        if keys & seen:
            continue

        seen |= keys
        kept.append(page)

    return kept


def discover_pages(app):
    pages = {}

    for rule in app.url_map.iter_rules():
        if "<" in rule.rule or "GET" not in (rule.methods or set()):
            continue

        # The homepage is the site itself, which the H1 and the summary
        # at the top of llms.txt already introduce.
        if rule.rule == "/":
            continue

        view = app.view_functions.get(rule.endpoint)

        if view is None or is_login_gated(view):
            continue

        page = _page(app.jinja_env, rule, view)

        if page is not None:
            pages.setdefault(page["path"], page)

    return sorted(_deduplicate(pages.values()), key=lambda page: page["path"])


def category_path(category):
    return f"/store/categories/{category['name']}"


def sitemap_paths(app, categories=()):
    paths = [page["path"] for page in discover_pages(app)]

    return paths + [category_path(category) for category in categories]


def _link(page):
    return {**page, "url": BASE_URL + add_suffix(page["path"])}


def _category_links(categories):
    return [
        {
            "url": BASE_URL + add_suffix(category_path(category)),
            "title": category["display_name"],
        }
        for category in categories
    ]


def llms_sections(pages, categories=STORE_CATEGORIES):
    grouped = defaultdict(list)

    for page in pages:
        grouped[page["section"]].append(_link(page))

    for link in EXTRA_LINKS:
        grouped[link["section"]].append(link)

    if categories:
        grouped["Store categories"] = _category_links(categories)

    known = [name for name in SECTION_ORDER if name in grouped]
    rest = sorted(name for name in grouped if name not in SECTION_ORDER)

    return [{"section": name, "links": grouped[name]} for name in known + rest]


def render_llms_full_txt(app, pages=None, on_skip=None):
    """
    The Markdown of every page in llms.txt.
    """

    if pages is None:
        pages = discover_pages(app)

    client = app.test_client()
    documents = []

    for path in ["/"] + [page["path"] for page in pages]:
        response = client.get(add_suffix(path))

        if response.status_code != 200:
            if on_skip is not None:
                on_skip(path, response.status_code)

            continue

        documents.append(response.get_data(as_text=True).strip())

    template = app.jinja_env.get_template("llms-full.txt")

    return template.render(documents=documents)


def render_llms_txt(app, categories=STORE_CATEGORIES):
    sections = llms_sections(discover_pages(app), categories)

    return app.jinja_env.get_template("llms.txt").render(sections=sections)
