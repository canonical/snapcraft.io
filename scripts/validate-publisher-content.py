#!/usr/bin/env python3

import argparse
from pathlib import Path

from webapp.store.publisher_content import validate_publisher_content_directory


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate publisher content YAML files."
    )
    parser.add_argument(
        "--content-dir",
        type=Path,
        required=True,
        help="Directory containing publisher YAML files.",
    )

    return parser.parse_args()


def main() -> int:
    args = parse_args()

    failures = validate_publisher_content_directory(args.content_dir)

    if not failures:
        return 0

    for failure in failures:
        for issue in failure.issues:
            print(f"{failure.file_name}: {issue.as_text()}")

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
