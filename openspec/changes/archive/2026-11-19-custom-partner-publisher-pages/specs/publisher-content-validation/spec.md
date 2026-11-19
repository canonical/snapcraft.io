# Publisher content validation delta

<!-- Source revisions (computed SHA-256):
- human-spec.md: fd21a8f7d5e83d1818f525a7908c9de1b368a6de7bd1184ec7253ee21e90678d
- testing-plan.md: 16c7eae1f943cdb91ad8510644a13728eed647652d655ecad91d94edd7aab992
-->

## Purpose

Enable repository-maintained custom publisher content to be checked consistently at startup and in CI, while invalid files cannot prevent other publisher pages from loading.

## ADDED Requirements

### Requirement: Publisher content contract
Publisher content MUST satisfy the field, type, optionality, nested-object, URI-format, and featured-snap constraints in the human specification. Unknown fields MUST be rejected. The displayed schema is a reference for validation, not a separately shipped machine-readable schema artifact.

Source: `human-spec.md` — Proposed new schema / Formal YAML Schema and the custom Python validator note; `testing-plan.md` — Testing strategy / Schema rules, tests 9.a and 10.

#### Scenario: Required content and optional fields
- **WHEN** a parsed publisher document contains string values for `display_name`, `summary`, `description`, and `publisher_since`
- **AND** any supplied optional fields satisfy the documented rules
- **THEN** it is accepted, including when all optional fields are absent
- **AND** the only optional top-level fields are `icon_url`, `website`, `contact`, `banner_url`, `meta_description`, `featured_snaps`, and `listed_snaps`
- **AND** the text fields are strings, with `icon_url`, `website`, and `banner_url` following the specified URI format

Source: `human-spec.md` — Sample custom publisher page file and Formal YAML Schema; `testing-plan.md` — Schema rules, tests 5 and 10.

#### Scenario: Featured and listed content structures
- **WHEN** `featured_snaps` or `listed_snaps` is supplied
- **THEN** each is an array of objects with no unknown item fields
- **AND** `featured_snaps` has at most two items, each requiring string `package_name`, `background`, and `description` values, with `background` matching `^#[0-9a-fA-F]{6}$`
- **AND** each `listed_snaps` item requires only a string `package_name`

Source: `human-spec.md` — Formal YAML Schema / featured_snaps and listed_snaps; `testing-plan.md` — tests 9.a and 10.

#### Scenario: Invalid content is rejected
- **WHEN** a required field is absent, an unknown field is present, a value has the wrong type, more than two featured snaps are supplied, or a featured background is not a valid six-digit hex colour
- **THEN** the content is rejected rather than admitted as a valid publisher document

Source: `human-spec.md` — Formal YAML Schema; `testing-plan.md` — tests 1.b, 9.a and 10.

### Requirement: Startup content admission
Startup SHALL register valid content by lowercase `.yaml` filename stem, enabling new publishers without code changes. Invalid files SHALL be excluded and logged without preventing startup or valid-file admission. Non-content files SHALL be ignored without errors.

Source: `human-spec.md` — Specification / overview item 3 and Formal YAML Schema / startup validation paragraph; `testing-plan.md` — tests 1, 1.a, 1.b and 1.c.

#### Scenario: Existing publishers are discovered from filenames
- **WHEN** startup loads a production or fixture directory containing the valid `jetbrains.yaml`, `kde.yaml`, and `snapcrafters.yaml` content files
- **THEN** the registry contains exactly `jetbrains`, `kde`, and `snapcrafters`, keyed by filename without its extension

Source: `human-spec.md` — Specification / overview item 3; `testing-plan.md` — test 1, both directory variants.

#### Scenario: Adding a publisher requires only content
- **WHEN** the fixture directory additionally contains valid `newpartner.yaml` and the application starts
- **THEN** `newpartner` is registered alongside the three existing publishers without an application-code change

Source: `human-spec.md` — Abstract and Specification / overview item 3; `testing-plan.md` — test 1.a.

#### Scenario: Invalid files do not prevent startup
- **WHEN** startup loads the three valid files and one file with a missing required field, unknown field, more than two featured snaps, invalid hex colour, malformed YAML, or empty content
- **THEN** the invalid file is absent from the registry
- **AND** one error identifies that filename
- **AND** the three valid publishers are registered and the application starts without an exception

Source: `human-spec.md` — Formal YAML Schema / startup validation paragraph; `testing-plan.md` — test 1.b, every listed variant.

#### Scenario: Non-content files are ignored
- **WHEN** the publisher content directory also contains `README.md`
- **THEN** that non-content file is not registered as a publisher and no error is logged for it

Source: `testing-plan.md` — Mocks item 4 and test 1.c.

### Requirement: Content validation command outcomes
The CI validation script SHALL exit zero without errors for valid content. Invalid content or uppercase filenames SHALL cause a nonzero exit with file-and-fault diagnostics. Schema errors SHALL name the field; uppercase-name errors SHALL state the lowercase requirement.

Source: `human-spec.md` — Specification / overview items 3 and 4, Formal YAML Schema / CI validation paragraph; `testing-plan.md` — Testing strategy / CI validation, tests 9, 9.a, 9.b and 9.d.

#### Scenario: Migrated production content passes validation
- **WHEN** the validation script checks the production content directory containing the migrated publisher files
- **THEN** it exits with code zero and reports no errors

Source: `human-spec.md` — Specification / overview item 4; `testing-plan.md` — tests 9 and 10.a.

#### Scenario: Invalid fixture content fails with diagnostics
- **WHEN** the script checks a fixture missing any required field, containing an unknown field, containing three featured snaps, using `#12345`, `red`, or `#GGGGGG` as a background, using an incorrect value type such as a string for `listed_snaps`, or containing malformed YAML
- **THEN** it exits with a nonzero code and identifies the file and the validation fault
- **AND** schema errors identify the field at fault, while malformed YAML is reported as a parsing failure

Source: `testing-plan.md` — test 9.a, all variants; test 9.d / filename and schema-field diagnostics.

#### Scenario: Uppercase publisher filenames fail validation
- **WHEN** an otherwise valid fixture is named `JetBrains.yaml`, `KDE.yaml`, or `newPartner.yaml`
- **THEN** the script exits with a nonzero code, names the file, and states that publisher filenames must be lowercase

Source: `human-spec.md` — Specification / overview item 3; `testing-plan.md` — test 9.b, all variants.
