"""
List of public pages that are used for llms.txt and the marketing
sitemap so the two cannot drift apart.

Only public and crawlable pages are added here. Anything behind login is
excluded. Those will be covered by /store/sitemap.xml.
"""

BASE_URL = "https://snapcraft.io"

PAGES = [
    {
        "section": "Main pages",
        "links": [
            {
                "path": "/",
                "title": "Snapcraft",
                "description": (
                    "The Snap Store: browse and install snaps, and "
                    "publish your own software to Linux users."
                ),
                "sitemap": False,
            },
            {
                "path": "/about",
                "title": "About snaps",
                "description": (
                    "What snaps are, how they are confined, and why they "
                    "work across Linux distributions."
                ),
            },
            {
                "path": "/store",
                "title": "Browse the store",
                "description": (
                    "Browse and search thousands of snaps by category, "
                    "from desktop apps to server and IoT software."
                ),
                "sitemap": False,
            },
            {
                "path": "/blog",
                "title": "Snapcraft blog",
                "description": (
                    "News and technical articles about snaps, the Snap "
                    "Store, and snap publishing."
                ),
                "sitemap": False,
            },
        ],
    },
    {
        "section": "Publishing a snap",
        "links": [
            {
                "path": "/about/publish",
                "title": "Publish a snap",
                "description": (
                    "How to register a name, upload a snap, and publish "
                    "it to the Snap Store."
                ),
            },
            {
                "path": "/about/listing",
                "title": "Write a store listing",
                "description": (
                    "How to write the title, summary, description, and "
                    "media that appear on a snap's store page."
                ),
            },
            {
                "path": "/about/release",
                "title": "Release to channels",
                "description": (
                    "How channels, tracks, and risk levels work when "
                    "releasing a snap to users."
                ),
            },
            {
                "path": "/about/publicise",
                "title": "Publicise a snap",
                "description": (
                    "Install buttons, badges, and embeddable cards for "
                    "promoting a published snap."
                ),
            },
            {
                "path": "/build",
                "title": "Build snaps from GitHub",
                "description": (
                    "Connect a GitHub repository to build snaps "
                    "automatically for every supported architecture."
                ),
            },
        ],
    },
    {
        "section": "Documentation",
        "sitemap": False,
        "links": [
            {
                "path": "/docs/",
                "title": "Snap documentation",
                "description": (
                    "Reference and explanation for snaps and snapd: "
                    "confinement, interfaces, channels, and the daemon."
                ),
            },
            {
                "url": "https://documentation.ubuntu.com/snapcraft/stable/",
                "title": "Snapcraft documentation",
                "description": (
                    "The build tool: snapcraft.yaml reference, plugins, "
                    "bases, and how-to guides for packaging software."
                ),
            },
            {
                "path": "/docs/snap-tutorials/",
                "title": "Snap tutorials",
                "description": (
                    "Guided lessons that walk through building and "
                    "publishing a first snap."
                ),
            },
        ],
    },
    {
        "section": "Optional",
        "optional": True,
        "links": [
            {
                "path": "/iot",
                "title": "Snaps for IoT",
                "description": (
                    "Using snaps and Ubuntu Core on embedded and IoT "
                    "devices."
                ),
            },
        ],
    },
]

# Public pages that are not added to llms.txt.
# Anything new must be listed above or excluded here on purpose.
EXCLUDED_PAGES = {
    "/_status/check": "health check",
    "/about/contact-us": "form",
    "/about/thank-you": "form confirmation",
    "/account/agreement": "part of the login flow",
    "/account/register-snap": "part of the login flow",
    "/blog/archives": "blog sub-listing",
    "/blog/events-and-webinars": "blog sub-listing",
    "/blog/feed": "feed",
    "/blog/latest": "blog sub-listing",
    "/blog/latest-news": "blog sub-listing",
    "/community": "redirects to /",
    "/create": "redirects to the Snapcraft docs",
    "/discover": "redirects to /store",
    "/docs/search": "search form",
    "/explore": "redirects to /store",
    "/feeds/updates": "feed",
    "/fish": "shell completion helper",
    "/login": "login flow",
    "/login-beta": "login flow",
    "/logout": "login flow",
    "/search": "search form",
    "/store/stats": "machine endpoint",
    "/tutorials": "redirects into the docs",
}


def listed_paths():
    """Every snapcraft.io path llms.txt points at."""
    return {
        link["path"]
        for group in PAGES
        for link in group["links"]
        if "path" in link
    }


def sitemap_pages():
    """Internal pages that belong in /sitemap-links.xml."""
    return [
        link
        for group in PAGES
        for link in group["links"]
        if "path" in link
        and group.get("sitemap", True)
        and link.get("sitemap", True)
    ]


def _resolve(group):
    """Turn a group's paths into absolute URLs."""
    return {
        "section": group["section"],
        "links": [
            {**link, "url": link.get("url") or BASE_URL + link["path"]}
            for link in group["links"]
        ],
    }


def _category_section(categories):
    return {
        "section": "Store categories",
        "links": [
            {
                "url": f"{BASE_URL}/store/categories/{category['name']}",
                "title": category["display_name"],
            }
            for category in categories
        ],
    }


def llms_sections(categories):
    """
    Ordered sections for llms.txt
    """
    sections = [
        _resolve(group) for group in PAGES if not group.get("optional")
    ]

    if categories:
        sections.append(_category_section(categories))

    sections.extend(
        _resolve(group) for group in PAGES if group.get("optional")
    )

    return sections
