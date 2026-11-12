"""Keep development-only Python tools out of production requirements."""

import re
import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEVELOPMENT_PACKAGES = {
    "black",
    "flake8",
    "flask-testing",
    "freezegun",
    "protego",
    "responses",
    "vcrpy-unittest",
}


def requirement_lines(filename):
    return [
        line.strip()
        for line in (PROJECT_ROOT / filename).read_text().splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]


def package_names(lines):
    return {
        re.split(r"[<=>!~;\[]", line, maxsplit=1)[0].lower().replace("_", "-")
        for line in lines
        if not line.startswith("-")
    }


class TestRequirements(unittest.TestCase):
    def test_runtime_excludes_development_packages(self):
        runtime = package_names(requirement_lines("requirements.txt"))

        self.assertTrue(runtime)
        self.assertTrue(runtime.isdisjoint(DEVELOPMENT_PACKAGES))

    def test_development_includes_runtime_requirements(self):
        development = requirement_lines("requirements-dev.txt")

        self.assertEqual(
            [line for line in development if line.startswith("-")],
            ["-r requirements.txt"],
        )

    def test_development_declares_test_and_lint_tools(self):
        runtime = package_names(requirement_lines("requirements.txt"))
        development = package_names(requirement_lines("requirements-dev.txt"))

        self.assertTrue(DEVELOPMENT_PACKAGES.issubset(development))
        self.assertTrue(runtime.isdisjoint(development))
