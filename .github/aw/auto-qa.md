# Automated browser QA

[`auto-qa.md`](../workflows/auto-qa.md) is the workflow source;
[`auto-qa.lock.yml`](../workflows/auto-qa.lock.yml) is the compiled Actions workflow.
Commit both when changing the workflow. It is advisory: it does not approve or
merge PRs and should not be a required branch-protection check.

## Setup

- Permit organization-billed Copilot inference. The workflow declares
  `copilot-requests: write` and uses the short-lived Actions token; no personal
  inference token or new provider is configured. Organization policy/billing must
  permit this use. The browser receives no website credentials.
- Enable PR demos (`DEMOS_ENABLED=true`) and configure the existing demo workflow's
  controller settings/secrets. Auto QA does not need the controller HMAC key.
- Create the `auto-qa` label. Only admins, maintainers and users with repository
  write access may activate the workflow. Fork PRs are excluded.

## Usage

1. Open a same-repository PR, ideally with actionable `## How to QA` steps.
2. Wait for the controller's `github-actions[bot]` comment to say **PR demo: ready**
   and for its linked **PR demo** workflow to complete successfully at the PR head.
3. Add **auto-qa**. New commits, opening a PR and posting comments do not trigger it.
4. Check the **Auto QA preflight** run summary first. Blocked/noop results skip
   the agent job entirely, with the reason in the preflight log and no PR comment.
   Fix the blocker and re-add the label to retry. Ready results start browser QA.
   Read its advisory report: per-route action lists and traffic-light results,
   collapsible expected/actual screenshots for failures, findings and coverage
   gaps. Partial or Blocked is not a pass.
5. Open that run's artifacts and download **auto-qa-evidence**. Evidence retention
   is 14 days unless overridden by repository gh-aw settings.

To rerun, remove and re-add the label **after the new current-head demo is ready**.
The label is retained; new commits do not automatically rerun QA. New reports
minimize older reports, and a new run for the same PR cancels its predecessor.

Missing/empty/placeholder QA instructions produce diff-guided regression-only
coverage. Unsafe, destructive or authentication-dependent steps are blocked, not
executed. Coverage is bounded and risk-based, not exhaustive E2E testing or a
numerical pixel-diff gate. The live production baseline can differ in data,
configuration or deployment timing from the PR's exact base commit.

## Evidence pipeline

The deterministic `qa_preflight` job validates context before inference, passing
ready context through a job output (never a public artifact). Context over
60,000 UTF-8 bytes is blocked rather than risking GitHub's output limit or the
receiving process's per-environment-variable limit.
The agent job runs only for `ready`; its trusted setup creates
`GITHUB_WORKSPACE/auto-qa-evidence` and writes the local `context.json`, adjusting
the evidence path to that runner's workspace. Copilot already has access there.
The agent captures PNGs directly there and never needs directory-creation, copy
commands, extra directory permissions or access to the runner's temporary area.
Context, credentials, cookies and browser profiles must not be stored there.

The agent calls `upload_artifact` with `path: "auto-qa-evidence"`. The safe-output
tool stages the permitted workspace directory automatically; the relative
`auto-qa-evidence/*.png` policy restricts publication to PNGs. The main agent has
no direct GitHub artifact/comment write credentials; safe outputs publish them
through the separate guarded job after threat detection.

A successful tool call records an upload request, not confirmed publication.
The returned temporary artifact ID is referenced in the report so the publisher
can resolve the link after upload. While publication is pending/unverified the
report stays Partial. Check the actual run artifact, not only its green status.
Uninspected images must not be marked as passing visual comparisons.

## Safety and freshness

- Paginated read-only GitHub APIs validate the controller marker, bot identity,
  exact PR HTTPS origin, successful `demo.yaml` run, PR association, head SHA,
  latest deployment ID/attempt and complete changed-file list. API/context
  failures fail closed. Arbitrary PR URLs and legacy `demos.haus` links are not
  accepted as the demo source.
- PR descriptions, patches, filenames, comments and page content are untrusted
  data. The agent must never check out, build, install or execute PR application
  source, dependencies, tests or copied commands. Framework jobs may check out
  workflow metadata; application code is not executed by the QA agent.
- Browsing uses fresh unauthenticated sessions on only the validated demo and
  production. Login, purchases, publishing, destructive actions, contact-form
  submissions, external navigation/downloads and private/metadata endpoints are
  prohibited. Search, filters, navigation and local UI state are permitted.
- The firewall retains a static service/asset allowlist. Exact demo-origin and
  non-mutating behavior also rely on agent instructions; they are not a formal
  guarantee against malicious page content. Do not broaden network access to
  hide coverage failures.
- Use standalone Playwright CLI commands, not shell functions, loops, pipes or
  copy helpers. The only authored supporting shell command is `cat`.
- The agent must recheck the PR, selected demo comment and latest deployment
  before reporting. Changed context produces Blocked (stale evidence); inability
  to complete those reads produces Blocked (freshness unverified). This final
  check is an agent instruction, not an atomic server-side reporting transaction.
- Diagnostic handlers must not create repository issues. Threat detection is
  enabled and fails closed. Telemetry uses the gh-aw defaults, including any
  configured organization-level collector settings.

## Cost controls

| Guardrail                                                               | AI credits |
| ----------------------------------------------------------------------- | ---------: |
| QA agent, per run                                                       |         50 |
| Threat detector, per run                                                |          5 |
| Rolling 24-hour activation guard, per triggering user for this workflow |        150 |

Main/detector limits are separate: up to 55 credits combined per run. These local
values replace the larger organization defaults. The daily activation check is
not a company-wide financial budget or a reservation of concurrent spend. GitHub
Actions compute is accounted for separately. The current model-selection
behavior is unchanged; no DeepSeek/GLM provider or credentials were introduced.

## Development and validation

Use **gh-aw v1.2.2** or a compatible newer release. The v1.2.2 setup action is
pinned to `53d0749e19424a918acd82b4d140264ce48f2f14`:

```bash
# Dependency-free fixtures execute the workflow's actual inline preflight.
dotrun exec node --test .github/tests/auto-qa.test.cjs

# Strict regeneration; commit source and generated lock together.
gh aw compile auto-qa --strict --action-mode action \
  --action-tag 53d0749e19424a918acd82b4d140264ce48f2f14 \
  --actionlint --shellcheck
```

The path-filtered **Auto QA workflow tests** CI job runs the fixtures without
installing application dependencies. Fixtures cover ready/missing/stale/spoofed
and failed demos, superseded deployments, closed/unlabeled/fork PRs, API errors,
changed heads, complete context, pre-created workspace evidence, relative PNG
policy, missing workspace, local credit caps, direct proxy digest pinning,
diagnostic issue suppression and default telemetry configuration. They do not execute the
AI prompt or prove hosted browser behavior.

## Verified pre-merge screenshot smoke test

The [smoke run](https://github.com/canonical/snapcraft.io/actions/runs/42981379820)
tested PR head `94f47f3bfac9362f712b502b9680cdca90131761`, using the source/normal
lock pinned to `48fd16da2e737336e77742e4231ed738e05e7eaf`. Its
[current-head demo deployment](https://github.com/canonical/snapcraft.io/actions/runs/42980335125)
succeeded. Copilot/Playwright executed, threat detection passed, safe outputs
published the [PR report](https://github.com/canonical/snapcraft.io/pull/5974#issuecomment-6790269151)
and the [auto-qa-evidence artifact](https://github.com/canonical/snapcraft.io/actions/runs/42981379820/artifacts/13838475047)
was downloaded and all nine PNGs independently opened and inspected:

- Desktop homepage: matching demo/production images at 1440x900.
- Desktop search: demo image after typing `firefox` and submitting; production
  search image was not captured, so this is not a screenshot pair.
- Desktop Firefox detail: demo error-page image versus working production page.
- Mobile homepage: matching demo/production images at 390x844.
- Open mobile menu: matching demo/production images at 390x844.

**The screenshot capture/staging/upload/download path is verified. The website QA
report remains Partial, not a clean regression pass.** The demo returned HTTP 502
on `/firefox`; mobile store/search, keyboard checks and some comparisons were
incomplete. The agent did not reverify the selected demo comment's timestamp, so
its final freshness verification was incomplete. These gaps are not erased by
successful artifact publication. The report's pending-artifact wording reflects
when it queued publication; the artifact was subsequently verified after the job.
The agent consumed approximately 35.5 AI credits, plus roughly one for detection.

Earlier attempts exposed a required `.lock.yml` executing filename in v1.2.2 and
Copilot's directory boundary: runner-temp is outside its permitted directories.
The fix pre-creates evidence in the already-permitted workspace; no access check
or metadata validation was bypassed. Temporary smoke workflows/tests are removed
from the final PR. Final cleanup leaves the tested production source/lock
unchanged at that cleanup revision; artifacts and reports identify the actual
tested revision. Subsequent review changes add the pre-inference job gate and
section-based report format; those changes have local fixture/compiler coverage,
not a new hosted smoke run.

The pre-merge harness deliberately loaded the exact pinned source rather than
its normal trusted PR base. Therefore the production trusted-base loader remains
untested until this new workflow exists on main. Do not merge solely to bypass
that test limitation. The temporary harness is not part of the production design.
