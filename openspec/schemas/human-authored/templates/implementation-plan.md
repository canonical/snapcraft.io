# Implementation plan

## Source revisions

| Human-owned input | SHA-256 at compilation |
| --- | --- |
| `human-spec.md` | <computed hash> |
| `testing-plan.md` | <computed hash> |

## Delta inventory

- `specs/<capability-path>/spec.md`

## Approved design constraints

- <Constraint already decided in human-spec.md, with its heading/ID/passage.>

## Coverage map

| Source behavior or quality gate | Delta requirement/scenario (or not applicable) | Task IDs |
| --- | --- | --- |
| <human-spec.md reference> | <delta path and requirement/scenario> | <IDs> |
| <testing-plan.md reference> | <delta reference or manual/testing-only gate> | <IDs> |

<!-- Repeat small behavior slices in dependency order. Include real source
references, commands/checks, expected results, and dependencies in each task.
Remove all comments and placeholders. Omit a sample phase only as permitted by
schema instructions (e.g. existing behavior gets verification, not a fake RED).
All checkboxes in this file count as tasks, including ones in examples. -->
## 1. <Approved behavior slice>

- [ ] 1.1 RED: <write the approved test>; source: <spec, test-plan, and delta references>; verify: <command fails for the intended missing behavior>.
- [ ] 1.2 GREEN: <implement only that behavior>; source: <references>; verify: <command passes the new test>.
- [ ] 1.3 REFACTOR/VERIFY: <review the touched code, clean up only if needed>; source: <references>; verify: <relevant tests still pass>.

## 2. Verification and human QA

- [ ] 2.1 VERIFY: <run the approved broader gates and check tests against the testing plan>; source: <references>; verify: <commands/checks and exact expected outcomes>.
- [ ] 2.2 HUMAN QA: engineer verifies the approved acceptance criteria; source: <references>; verify: explicit engineer confirmation, recorded below.

## Execution evidence

<!-- Populate during apply, not during compilation. Use plain bullets, never
extra checkboxes. Record task ID, actual command/check, observed result and any
blocker. A RED task's evidence must explain why the test failed. -->

## Workflow follow-up

<!-- Plain bullets only. Preserve approved follow-up, if any; remove this section
if none. Do not invent deployment, archive, or approval steps. -->
