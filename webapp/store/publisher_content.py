import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, ClassVar
from urllib.parse import urlparse

from ruamel.yaml import YAML

HEX_COLOR_PATTERN = re.compile(r"^#[0-9a-fA-F]{6}$")


@dataclass(frozen=True)
class ValidationIssue:
    field: str
    message: str

    def as_text(self) -> str:
        if not self.field:
            return self.message

        return f"{self.field}: {self.message}"


class PublisherContentValidator:
    REQUIRED_STRING_FIELDS = frozenset(
        {
            "description",
            "display_name",
            "publisher_since",
            "summary",
        }
    )

    OPTIONAL_STRING_FIELDS = frozenset(
        {
            "banner_url",
            "contact",
            "icon_url",
            "meta_description",
            "website",
        }
    )

    URI_FIELDS = frozenset({"icon_url", "website", "contact", "banner_url"})

    # contact may be a mailto link; the other URI fields are sources for
    # images / CSS backgrounds or outbound links, so they must be https.
    URI_FIELD_SCHEMES: ClassVar[dict[str, set[str]]] = {
        "icon_url": {"https"},
        "website": {"https"},
        "contact": {"https", "mailto"},
        "banner_url": {"https"},
    }

    FEATURED_ITEM_FIELDS = frozenset(
        {"background", "description", "package_name"}
    )
    LISTED_ITEM_FIELDS = frozenset({"package_name"})

    def validate(self, content: Any) -> list[ValidationIssue]:
        if not isinstance(content, dict):
            return [
                ValidationIssue(
                    field="<root>",
                    message="publisher content must be a YAML object",
                )
            ]

        issues: list[ValidationIssue] = []

        allowed_top_level_fields = (
            self.REQUIRED_STRING_FIELDS
            | self.OPTIONAL_STRING_FIELDS
            | {"featured_snaps", "listed_snaps"}
        )

        for key in content:
            if key not in allowed_top_level_fields:
                issues.append(
                    ValidationIssue(
                        field=key,
                        message="field is not allowed in publisher content",
                    )
                )

        for field in self.REQUIRED_STRING_FIELDS:
            if field not in content:
                issues.append(
                    ValidationIssue(field=field, message="field is required")
                )
                continue

            if not isinstance(content[field], str):
                issues.append(
                    ValidationIssue(field=field, message="must be a string")
                )

        for field in self.OPTIONAL_STRING_FIELDS:
            if field not in content:
                continue

            value = content[field]
            if not isinstance(value, str):
                issues.append(
                    ValidationIssue(field=field, message="must be a string")
                )
                continue

            if field in self.URI_FIELDS and not self._is_valid_uri(
                field, value
            ):
                issues.append(
                    ValidationIssue(field=field, message="must be a valid URI")
                )

        featured_snaps = content.get("featured_snaps")
        if featured_snaps is not None:
            issues.extend(self._validate_featured_snaps(featured_snaps))

        listed_snaps = content.get("listed_snaps")
        if listed_snaps is not None:
            issues.extend(self._validate_listed_snaps(listed_snaps))

        return issues

    def _validate_featured_snaps(
        self, featured_snaps: Any
    ) -> list[ValidationIssue]:
        if not isinstance(featured_snaps, list):
            return [
                ValidationIssue(
                    field="featured_snaps", message="must be an array"
                )
            ]

        issues: list[ValidationIssue] = []

        if len(featured_snaps) > 2:
            issues.append(
                ValidationIssue(
                    field="featured_snaps",
                    message="must contain at most two snaps",
                )
            )

        for index, snap in enumerate(featured_snaps):
            field_prefix = f"featured_snaps[{index}]"

            if not isinstance(snap, dict):
                issues.append(
                    ValidationIssue(
                        field=field_prefix,
                        message="must be an object",
                    )
                )
                continue

            unknown_fields = set(snap.keys()) - self.FEATURED_ITEM_FIELDS
            for unknown_field in sorted(unknown_fields):
                issues.append(
                    ValidationIssue(
                        field=f"{field_prefix}.{unknown_field}",
                        message="field is not allowed",
                    )
                )

            for required_field in self.FEATURED_ITEM_FIELDS:
                if required_field not in snap:
                    issues.append(
                        ValidationIssue(
                            field=f"{field_prefix}.{required_field}",
                            message="field is required",
                        )
                    )
                    continue

                if not isinstance(snap[required_field], str):
                    issues.append(
                        ValidationIssue(
                            field=f"{field_prefix}.{required_field}",
                            message="must be a string",
                        )
                    )

            if "background" in snap and isinstance(snap["background"], str):
                if not HEX_COLOR_PATTERN.fullmatch(snap["background"]):
                    issues.append(
                        ValidationIssue(
                            field=f"{field_prefix}.background",
                            message="must be a six-digit hex colour",
                        )
                    )

        return issues

    def _validate_listed_snaps(
        self, listed_snaps: Any
    ) -> list[ValidationIssue]:
        if not isinstance(listed_snaps, list):
            return [
                ValidationIssue(
                    field="listed_snaps", message="must be an array"
                )
            ]

        issues: list[ValidationIssue] = []

        for index, snap in enumerate(listed_snaps):
            field_prefix = f"listed_snaps[{index}]"

            if not isinstance(snap, dict):
                issues.append(
                    ValidationIssue(
                        field=field_prefix,
                        message="must be an object",
                    )
                )
                continue

            unknown_fields = set(snap.keys()) - self.LISTED_ITEM_FIELDS
            for unknown_field in unknown_fields:
                issues.append(
                    ValidationIssue(
                        field=f"{field_prefix}.{unknown_field}",
                        message="field is not allowed",
                    )
                )

            package_name = snap.get("package_name")
            if package_name is None:
                issues.append(
                    ValidationIssue(
                        field=f"{field_prefix}.package_name",
                        message="field is required",
                    )
                )
            elif not isinstance(package_name, str):
                issues.append(
                    ValidationIssue(
                        field=f"{field_prefix}.package_name",
                        message="must be a string",
                    )
                )

        return issues

    def _is_valid_uri(self, field: str, value: str) -> bool:
        try:
            parsed_uri = urlparse(value)
        except ValueError:
            return False

        allowed_schemes = self.URI_FIELD_SCHEMES.get(field, {"https"})
        if parsed_uri.scheme not in allowed_schemes:
            return False

        if parsed_uri.scheme == "mailto":
            return bool(parsed_uri.path)

        return bool(parsed_uri.netloc)


@dataclass(frozen=True)
class FileValidationResult:
    file_name: str
    issues: list[ValidationIssue]


def _validate_directory(
    content_directory: Path,
) -> tuple[dict[str, dict[str, Any]], list[FileValidationResult]]:
    validator = PublisherContentValidator()
    yaml_loader = YAML(typ="safe")

    registry: dict[str, dict[str, Any]] = {}
    failures: list[FileValidationResult] = []

    for file_path in sorted(content_directory.iterdir()):
        if not file_path.is_file():
            continue

        if file_path.suffix != ".yaml":
            continue

        file_issues: list[ValidationIssue] = []

        if file_path.stem != file_path.stem.lower():
            file_issues.append(
                ValidationIssue(
                    field="filename",
                    message="publisher file names must be lowercase",
                )
            )
            failures.append(
                FileValidationResult(
                    file_name=file_path.name,
                    issues=file_issues,
                )
            )
            continue

        try:
            with file_path.open("r") as content_file:
                content = yaml_loader.load(content_file)
        except Exception as error:
            file_issues.append(
                ValidationIssue(
                    field="<root>",
                    message=f"malformed YAML: {error}",
                )
            )
            failures.append(
                FileValidationResult(
                    file_name=file_path.name,
                    issues=file_issues,
                )
            )
            continue

        if content is None:
            file_issues.append(
                ValidationIssue(
                    field="<root>",
                    message="publisher content file is empty",
                )
            )
            failures.append(
                FileValidationResult(
                    file_name=file_path.name,
                    issues=file_issues,
                )
            )
            continue

        file_issues.extend(validator.validate(content))

        if file_issues:
            failures.append(
                FileValidationResult(
                    file_name=file_path.name,
                    issues=file_issues,
                )
            )
            continue

        registry[file_path.stem] = content

    return registry, failures


def validate_publisher_content_directory(
    content_directory: Path,
) -> list[FileValidationResult]:
    _, failures = _validate_directory(content_directory)
    return failures


def initialize_publisher_content_registry(app) -> None:
    content_directory = (
        Path(app.root_path)
        / app.config["CONTENT_DIRECTORY"]["PUBLISHER_PAGES"]
    )

    registry, _ = _validate_directory(content_directory)

    app.extensions["publisher_pages_registry"] = registry
