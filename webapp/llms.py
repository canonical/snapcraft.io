"""
llms.txt, llms-full.txt and the Markdown version of every page
"""

from canonicalwebteam.store_llm import StoreLLM

BASE_URL = "https://snapcraft.io"

SUMMARY = (
    "Snapcraft is the home of the Snap Store, where thousands of snaps - "
    "containerised software packages that install and run across Linux "
    "distributions - are published and browsed. Publishers use "
    "snapcraft.io to register names, build, release, and manage their "
    "snaps."
)

# Sections are keyed by the first segment of the path. A new page under
# a known area files itself.
SECTIONS = {
    "": "Main pages",
    "about": "Publishing a snap",
    "account": "Publishing a snap",
    "docs": "Documentation",
    "tutorials": "Documentation",
    "store": "Store",
    "blog": "Blog",
}

SECTION_ORDER = [
    "Main pages",
    "Publishing a snap",
    "Documentation",
    "Store",
    "Blog",
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

store_llm = StoreLLM(
    base_url=BASE_URL,
    site_name="Snapcraft",
    summary=SUMMARY,
    sections=SECTIONS,
    section_order=SECTION_ORDER,
    extra_links=EXTRA_LINKS,
)
