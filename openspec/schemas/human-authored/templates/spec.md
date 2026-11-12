# <Capability> delta

<!-- Source revisions (computed SHA-256):
- human-spec.md: <hash>
- testing-plan.md: <hash>
Keep this populated provenance comment. It is change-local metadata, not a
behavior requirement to merge into the main spec. -->

<!-- New capability only: retain Purpose and translate it from the human spec.
For an existing capability, remove this section. -->
## Purpose

<Approved capability purpose, at least 50 characters.>

<!-- Keep only applicable operations. Repeat requirements and scenarios as
needed. Remove instructional comments and placeholders from the compiled file,
but retain the populated provenance comment above.
For MODIFIED, copy the complete existing requirement including retained scenarios,
then change only what the sources authorize. Cite those sources and identify
retained baseline material. A testing-only gate belongs in the plan. -->
## ADDED Requirements

### Requirement: <Source-backed requirement name>
The system SHALL <approved observable behavior>.

Source: `human-spec.md` — <heading/ID/passage>.

#### Scenario: <Source-backed scenario name>
- **WHEN** <approved condition>
- **THEN** <approved outcome>

Source: `human-spec.md` — <heading/ID/passage>; `testing-plan.md` — <heading/ID/passage>.

## MODIFIED Requirements

### Requirement: <Exact existing requirement name>
<Full updated requirement and all retained/updated scenarios, with source references.>

## REMOVED Requirements

### Requirement: <Exact existing requirement name>
**Reason**: <Approved reason and source reference.>
**Migration**: <Approved migration, or explicitly approved lack of migration, and source reference.>

## RENAMED Requirements

- FROM: `### Requirement: <Exact old name>`
- TO: `### Requirement: <Approved new name>`

<!-- Cite the approved rename in a preamble HTML comment rather than adding
ordinary preamble text or non-operation text to the RENAMED section. -->
