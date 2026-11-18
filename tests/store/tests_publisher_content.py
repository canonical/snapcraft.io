import copy
import logging
import os
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path

from webapp.store.publisher_content import (
    PublisherContentValidator,
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

    def test_registry_data_is_plain_data(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self._write_valid_triplet(temp_path)

            registry = load_publisher_content_registry(temp_path)
            original_registry = copy.deepcopy(registry)

            registry["jetbrains"]["summary"] = "changed"

            self.assertNotEqual(registry, original_registry)


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

    def test_validation_command_reports_missing_field(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self._write_file(
                temp_path,
                "jetbrains.yaml",
                """
                display_name: JetBrains
                description: "<p>desc</p>"
                publisher_since: January 2020
                """,
            )

            result = self._run_validation_script(temp_path)

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("jetbrains.yaml", result.stdout)
            self.assertIn("summary", result.stdout)

    def test_validation_command_reports_uppercase_filename(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self._write_file(
                temp_path,
                "JetBrains.yaml",
                """
                display_name: JetBrains
                summary: Summary
                description: "<p>desc</p>"
                publisher_since: January 2020
                """,
            )

            result = self._run_validation_script(temp_path)

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("JetBrains.yaml", result.stdout)
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
