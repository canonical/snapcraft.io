import copy
import logging
import os
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path

from unittest.mock import MagicMock

from webapp.store.publisher_content import (
    PublisherContentValidator,
    initialize_publisher_content_registry,
    load_publisher_content_registry,
    validate_publisher_content_directory,
)


def _valid_content(display_name="Publisher") -> dict[str, object]:
    return {
        "display_name": display_name,
        "summary": "Summary",
        "description": "<p>Description</p>",
        "publisher_since": "January 2020",
    }


def _yaml_for(data):
    lines = []
    for key, value in data.items():
        if isinstance(value, str):
            lines.append(f"{key}: {value!r}")
        elif isinstance(value, list):
            lines.append(f"{key}:")
            for item in value:
                lines.append("  -")
                for item_key, item_value in item.items():
                    lines.append(f"    {item_key}: {item_value!r}")
        else:
            lines.append(f"{key}: {value!r}")

    return "\n".join(lines) + "\n"


class PublisherContentValidatorTest(unittest.TestCase):
    def setUp(self):
        self.validator = PublisherContentValidator()

    def test_accepts_required_fields_only(self):
        issues = self.validator.validate(_valid_content())
        self.assertEqual(issues, [])

    def test_rejects_unknown_top_level_field(self):
        content = _valid_content()
        content["unexpected"] = "value"

        issues = self.validator.validate(content)

        self.assertEqual(len(issues), 1)
        self.assertEqual(issues[0].field, "unexpected")

    def test_rejects_missing_required_fields(self):
        for field in (
            "display_name",
            "summary",
            "description",
            "publisher_since",
        ):
            with self.subTest(field=field):
                content = _valid_content()
                del content[field]

                issues = self.validator.validate(content)
                self.assertIn(field, [issue.field for issue in issues])

    def test_rejects_more_than_two_featured_snaps(self):
        content = _valid_content()
        content["featured_snaps"] = [
            {
                "package_name": "one",
                "background": "#123456",
                "description": "One",
            },
            {
                "package_name": "two",
                "background": "#654321",
                "description": "Two",
            },
            {
                "package_name": "three",
                "background": "#abcdef",
                "description": "Three",
            },
        ]

        issues = self.validator.validate(content)
        issue_fields = [issue.field for issue in issues]

        self.assertIn("featured_snaps", issue_fields)

    def test_rejects_invalid_featured_background(self):
        for invalid_color in ("#12345", "red", "#GGGGGG"):
            with self.subTest(color=invalid_color):
                content = _valid_content()
                content["featured_snaps"] = [
                    {
                        "package_name": "snap",
                        "background": invalid_color,
                        "description": "desc",
                    }
                ]

                issues = self.validator.validate(content)
                self.assertIn(
                    "featured_snaps[0].background",
                    [issue.field for issue in issues],
                )

    def test_rejects_invalid_uri_fields(self):
        content = _valid_content()
        content["website"] = "not-a-url"

        issues = self.validator.validate(content)

        self.assertIn("website", [issue.field for issue in issues])


class PublisherContentRegistryLoadingTest(unittest.TestCase):
    def _write_publisher_file(self, directory, name, content):
        file_path = Path(directory) / f"{name}.yaml"
        file_path.write_text(_yaml_for(content))

    def _write_raw_file(self, directory, name, content):
        file_path = Path(directory) / name
        file_path.write_text(content)

    def _write_valid_triplet(self, directory):
        self._write_publisher_file(
            directory,
            "jetbrains",
            _valid_content("JetBrains"),
        )
        self._write_publisher_file(directory, "kde", _valid_content("KDE"))
        self._write_publisher_file(
            directory,
            "snapcrafters",
            _valid_content("Snapcrafters"),
        )

    def test_loads_expected_publishers_from_filenames(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self._write_valid_triplet(temp_path)
            (temp_path / "README.md").write_text("content")

            registry = load_publisher_content_registry(temp_path)

            self.assertEqual(
                set(registry.keys()),
                {"jetbrains", "kde", "snapcrafters"},
            )

    def test_adding_new_file_adds_new_publisher(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self._write_valid_triplet(temp_path)
            self._write_publisher_file(
                temp_path,
                "newpartner",
                _valid_content("New Partner"),
            )

            registry = load_publisher_content_registry(temp_path)

            self.assertEqual(
                set(registry.keys()),
                {"jetbrains", "kde", "newpartner", "snapcrafters"},
            )

    def test_invalid_file_is_skipped_and_logged(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self._write_valid_triplet(temp_path)
            invalid_content = _valid_content()
            del invalid_content["summary"]
            self._write_publisher_file(temp_path, "broken", invalid_content)

            logger = logging.getLogger("publisher-content-test")
            with self.assertLogs(logger, level="ERROR") as logs:
                registry = load_publisher_content_registry(
                    temp_path,
                    logger=logger,
                )

            self.assertNotIn("broken", registry)
            self.assertTrue(
                any("broken.yaml" in message for message in logs.output)
            )

    def test_invalid_variants_are_skipped_and_non_yaml_is_ignored(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self._write_valid_triplet(temp_path)
            (temp_path / "README.md").write_text("non-content")

            missing_summary = _valid_content("Missing Summary")
            del missing_summary["summary"]
            self._write_publisher_file(
                temp_path,
                "missing-required",
                missing_summary,
            )

            with_extra_field = _valid_content("Extra")
            with_extra_field["unexpected"] = "nope"
            self._write_publisher_file(
                temp_path,
                "unknown-field",
                with_extra_field,
            )

            with_three_featured = _valid_content("Three")
            with_three_featured["featured_snaps"] = [
                {
                    "package_name": "snap-one",
                    "background": "#000000",
                    "description": "one",
                },
                {
                    "package_name": "snap-two",
                    "background": "#111111",
                    "description": "two",
                },
                {
                    "package_name": "snap-three",
                    "background": "#222222",
                    "description": "three",
                },
            ]
            self._write_publisher_file(
                temp_path,
                "three-featured",
                with_three_featured,
            )

            with_invalid_color = _valid_content("Invalid color")
            with_invalid_color["featured_snaps"] = [
                {
                    "package_name": "snap-one",
                    "background": "red",
                    "description": "one",
                }
            ]
            self._write_publisher_file(
                temp_path,
                "invalid-color",
                with_invalid_color,
            )

            self._write_raw_file(
                temp_path,
                "malformed.yaml",
                "display_name: malformed\nsummary: test\ndescription: [\n",
            )
            self._write_raw_file(temp_path, "empty.yaml", "")

            logger = logging.getLogger(
                "publisher-content-test-invalid-variants"
            )
            with self.assertLogs(logger, level="ERROR") as logs:
                registry = load_publisher_content_registry(
                    temp_path,
                    logger=logger,
                )

            self.assertEqual(
                set(registry.keys()),
                {"jetbrains", "kde", "snapcrafters"},
            )

            expected_invalid_files = {
                "missing-required.yaml",
                "unknown-field.yaml",
                "three-featured.yaml",
                "invalid-color.yaml",
                "malformed.yaml",
                "empty.yaml",
            }

            for expected_invalid_file in expected_invalid_files:
                with self.subTest(file_name=expected_invalid_file):
                    self.assertTrue(
                        any(
                            expected_invalid_file in message
                            for message in logs.output
                        )
                    )

            self.assertFalse(
                any("README.md" in message for message in logs.output)
            )

    def test_registry_data_is_plain_data(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self._write_valid_triplet(temp_path)

            registry = load_publisher_content_registry(temp_path)
            original_registry = copy.deepcopy(registry)

            registry["jetbrains"]["summary"] = "changed"

            self.assertNotEqual(registry, original_registry)


class InitializePublisherContentRegistryTest(unittest.TestCase):
    def _app_for(self, content_directory):
        app = MagicMock()
        app.root_path = str(content_directory.parent)
        app.config = {
            "CONTENT_DIRECTORY": {
                "PUBLISHER_PAGES": content_directory.name,
            }
        }
        app.extensions = {}
        return app

    def test_valid_content_populates_registry_extension(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            content_directory = Path(temp_dir) / "publishers"
            content_directory.mkdir()
            (content_directory / "jetbrains.yaml").write_text(
                _yaml_for(_valid_content("JetBrains"))
            )

            app = self._app_for(content_directory)
            initialize_publisher_content_registry(app)

            self.assertEqual(
                set(app.extensions["publisher_pages_registry"].keys()),
                {"jetbrains"},
            )

    def test_invalid_content_fails_startup(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            content_directory = Path(temp_dir) / "publishers"
            content_directory.mkdir()
            invalid_content = _valid_content("Broken")
            del invalid_content["summary"]
            (content_directory / "broken.yaml").write_text(
                _yaml_for(invalid_content)
            )

            app = self._app_for(content_directory)
            with self.assertRaises(RuntimeError) as raised:
                initialize_publisher_content_registry(app)

            self.assertIn("broken.yaml", str(raised.exception))
            self.assertNotIn("publisher_pages_registry", app.extensions)

    def test_all_invalid_content_fails_startup(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            content_directory = Path(temp_dir) / "publishers"
            content_directory.mkdir()
            (content_directory / "empty.yaml").write_text("")
            (content_directory / "malformed.yaml").write_text(
                "display_name: [\n"
            )

            app = self._app_for(content_directory)
            with self.assertRaises(RuntimeError) as raised:
                initialize_publisher_content_registry(app)

            message = str(raised.exception)
            self.assertIn("empty.yaml", message)
            self.assertIn("malformed.yaml", message)
            self.assertNotIn("publisher_pages_registry", app.extensions)


class PublisherContentValidationScriptTest(unittest.TestCase):
    def _run_validation_script(self, content_dir):
        project_root = Path(__file__).resolve().parents[2]
        script_path = (
            project_root / "scripts" / "validate-publisher-content.py"
        )

        env = os.environ.copy()
        env["PYTHONPATH"] = str(project_root)

        return subprocess.run(
            [
                sys.executable,
                str(script_path),
                "--content-dir",
                str(content_dir),
            ],
            check=False,
            capture_output=True,
            text=True,
            cwd=project_root,
            env=env,
        )

    def _write_file(self, directory, name, body):
        file_path = Path(directory) / name
        file_path.write_text(textwrap.dedent(body).lstrip())

    def test_validation_command_passes_for_valid_content(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self._write_file(
                temp_path,
                "jetbrains.yaml",
                """
                display_name: JetBrains
                summary: Summary
                description: "<p>desc</p>"
                publisher_since: January 2020
                """,
            )

            result = self._run_validation_script(temp_path)

            self.assertEqual(result.returncode, 0)
            self.assertEqual(result.stdout.strip(), "")

    def test_validation_command_reports_missing_each_required_field(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)

            base_content = {
                "display_name": "JetBrains",
                "summary": "Summary",
                "description": "<p>desc</p>",
                "publisher_since": "January 2020",
            }

            for missing_field in base_content:
                with self.subTest(field=missing_field):
                    content = dict(base_content)
                    del content[missing_field]

                    self._write_file(
                        temp_path,
                        "jetbrains.yaml",
                        _yaml_for(content),
                    )

                    result = self._run_validation_script(temp_path)

                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn("jetbrains.yaml", result.stdout)
                    self.assertIn(missing_field, result.stdout)

    def test_validation_command_reports_unknown_field(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self._write_file(
                temp_path,
                "jetbrains.yaml",
                """
                display_name: JetBrains
                summary: Summary
                description: "<p>desc</p>"
                publisher_since: January 2020
                extra_field: no
                """,
            )

            result = self._run_validation_script(temp_path)

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("jetbrains.yaml", result.stdout)
            self.assertIn("extra_field", result.stdout)

    def test_validation_command_reports_three_featured_snaps(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self._write_file(
                temp_path,
                "jetbrains.yaml",
                """
                display_name: JetBrains
                summary: Summary
                description: "<p>desc</p>"
                publisher_since: January 2020
                featured_snaps:
                  - package_name: one
                    background: "#000000"
                    description: one
                  - package_name: two
                    background: "#111111"
                    description: two
                  - package_name: three
                    background: "#222222"
                    description: three
                """,
            )

            result = self._run_validation_script(temp_path)

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("featured_snaps", result.stdout)

    def test_validation_command_reports_invalid_featured_colors(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)

            for invalid_color in ("#12345", "red", "#GGGGGG"):
                with self.subTest(color=invalid_color):
                    self._write_file(
                        temp_path,
                        "jetbrains.yaml",
                        f"""
                        display_name: JetBrains
                        summary: Summary
                        description: "<p>desc</p>"
                        publisher_since: January 2020
                        featured_snaps:
                          - package_name: one
                            background: "{invalid_color}"
                            description: one
                        """,
                    )

                    result = self._run_validation_script(temp_path)

                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn("background", result.stdout)

    def test_validation_command_reports_wrong_listed_type(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self._write_file(
                temp_path,
                "jetbrains.yaml",
                """
                display_name: JetBrains
                summary: Summary
                description: "<p>desc</p>"
                publisher_since: January 2020
                listed_snaps: not-a-list
                """,
            )

            result = self._run_validation_script(temp_path)

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("listed_snaps", result.stdout)

    def test_validation_command_reports_uppercase_filename(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)

            for filename in ("JetBrains.yaml", "KDE.yaml", "newPartner.yaml"):
                with self.subTest(filename=filename):
                    self._write_file(
                        temp_path,
                        filename,
                        """
                        display_name: JetBrains
                        summary: Summary
                        description: "<p>desc</p>"
                        publisher_since: January 2020
                        """,
                    )

                    result = self._run_validation_script(temp_path)

                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn(filename, result.stdout)
                    self.assertIn("must be lowercase", result.stdout)

    def test_validation_command_reports_malformed_yaml(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self._write_file(
                temp_path,
                "jetbrains.yaml",
                """
                display_name: JetBrains
                summary: Summary
                description: [
                publisher_since: January 2020
                """,
            )

            result = self._run_validation_script(temp_path)

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("jetbrains.yaml", result.stdout)
            self.assertIn("malformed YAML", result.stdout)


class PublisherContentDirectoryValidationTest(unittest.TestCase):
    def test_validate_directory_returns_failures(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            content_directory = Path(temp_dir)
            (content_directory / "JetBrains.yaml").write_text(
                _yaml_for(_valid_content("JetBrains"))
            )

            failures = validate_publisher_content_directory(content_directory)

            self.assertEqual(len(failures), 1)
            self.assertEqual(failures[0].file_name, "JetBrains.yaml")
            self.assertIn(
                "must be lowercase",
                failures[0].issues[0].as_text(),
            )


if __name__ == "__main__":
    unittest.main()
