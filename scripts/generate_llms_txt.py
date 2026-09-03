#!/usr/bin/env python3
"""
Write static/llms.txt from the pages discovered in the routing table.

Run as part of the build so the file is on disk before the app serves
it. Store categories come from the store API and are skipped if it
cannot be reached.
"""

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

os.environ.setdefault("SECRET_KEY", "llms-txt-generation")

from webapp.app import create_app
from webapp.packages.logic import get_store_categories
from webapp.site_pages import discover_pages, render_llms_txt

OUTPUT = os.path.join(ROOT, "static", "llms.txt")


def categories():
    try:
        return get_store_categories()
    except Exception as error:
        print(f"llms.txt: no store categories ({error})", file=sys.stderr)
        return []


def main():
    app = create_app()
    pages = discover_pages(app)

    missing = [page["path"] for page in pages if not page["description"]]

    if missing:
        print(
            "llms.txt: no meta_description on " + ", ".join(missing),
            file=sys.stderr,
        )

    with app.app_context():
        content = render_llms_txt(app, categories())

    with open(OUTPUT, "w") as llms_txt_file:
        llms_txt_file.write(content)

    links = content.count("\n- [")

    print(
        f"llms.txt: wrote {links} links from {len(pages)} discovered "
        f"pages to {os.path.relpath(OUTPUT, ROOT)}"
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
