# Automated browser QA

[`auto-qa.md`](../workflows/auto-qa.md) is the source for the agentic workflow;
[`auto-qa.lock.yml`](../workflows/auto-qa.lock.yml) is the compiled Actions workflow.
Commit both files when making changes. The workflow is advisory: it neither
approves nor merges PRs, and is not intended as a required branch-protection check.

## Setup

- Allow GitHub Agentic Workflows / Copilot inference for this repository. This
  workflow requests `copilot-requests: write` for inference using the Actions
  token; the browser is not given website credentials. Repository/organization
  policies and billing must permit this, as for the existing Copilot workflow.
- Enable PR demos (`DEMOS_ENABLED=true`) and configure the existing demo workflow's
  controller settings/secrets. Auto QA does not need the controller HMAC key.
- Create an `auto-qa` label if it does not already exist. Only repository admins,
  maintainers, and users with write access may activate the workflow.

## Usage

1. Open a same-repository PR and, ideally, provide actionable `## How to QA` steps.
2. Wait for the `github-actions[bot]` controller comment to say **PR demo: ready**
   and for the linked **PR demo** workflow run to complete successfully.
3. Add the **auto-qa** label. Opening, updating, or commenting on a PR does not
   trigger this workflow. Forks are excluded, matching demo deployment support.
4. Read the **Auto QA** comment: tested routes/states, desktop and mobile actions,
   expected/actual results, confirmed regressions, and blocked/untested coverage.
5. Open that run's **Artifacts** to download `auto-qa-evidence`. PNG filenames map
   demo/production screenshot pairs to the reported routes and viewports. Evidence
   retention is 14 days unless overridden by repository gh-aw settings.

To rerun after changes or a blocked deployment, **remove and re-add the label**
after the new demo is ready. The label is retained; new commits do not automatically
rerun QA. Previous reports are minimized when a newer report is posted. Runs for
the same PR cancel older in-progress runs.

Missing/empty/placeholder QA instructions produce regression-only testing based
on the diff and description. Authentication-dependent or destructive steps are
reported as blocked, not executed. A blocked or partial report is not a pass.

## Scope and safeguards

- The preflight uses paginated read-only GitHub APIs to collect PR context and
  select the controller's comment, not legacy `demos.haus` links or arbitrary URLs.
- It checks the comment's exact HTTPS origin, repository/PR marker, bot identity,
  linked `demo.yaml` run, successful completion, PR association, head SHA, and
  latest deployment run before allowing browsing. API or incomplete-diff failures
  fail closed. The agent rechecks freshness before reporting and identifies the
  exact tested revision in its comment.
- The QA agent does not check out/build/run PR source or follow shell commands in
  PR text. GitHub context is read-only; comments and evidence use safe outputs.
  The compiler may check out workflow metadata in framework jobs; no application
  source is checked out for execution by the QA agent.
- Missing-tool, incomplete-run, failure, and threat-detection reporting must not
  create repository issues. Diagnostics stay in Actions; the intended visible
  write is the PR report. Threat detection remains enabled and fails closed.
- OTLP export is explicitly disabled, including inherited endpoint/header values,
  so QA traces are not sent to an optional organization-configured collector.
- The browser is unauthenticated and may navigate only to the validated demo and
  production. It must not log in, change server-side state, submit contact forms,
  follow external redirects/downloads, or bypass network restrictions. These
  behavior rules are agent instructions; they do not make an arbitrary demo page
  trusted. Review reports and screenshots before relying on them.
- gh-aw requires a static network allowlist. It includes the marketplace demo
  service and required asset/font hosts; the preflight and prompt further restrict
  navigation to this PR's exact demo origin. Unexpected blocked assets should be
  reported as a coverage limitation, not worked around with a broad allowlist.
- Production is the live `https://snapcraft.io` baseline captured during the run,
  **not a build of the PR's exact base commit**. Data, configuration, intended
  changes, and production lag must be distinguished from unexpected regressions.
- Coverage is bounded and risk-based, normally starting with at most eight routes
  and paired 1440x900 / 390x844 screenshots. It is not exhaustive E2E testing or a
  numerical pixel-diff gate. A pass requires actual browser execution and image
  inspection; unsupported checks must stay visible as gaps.
- Screenshots are written directly to `evidence_directory` from the trusted
  context, under the runner's safe-output upload staging directory. The uploader
  accepts `path: "auto-qa-evidence"` and allows only staging-relative
  `auto-qa-evidence/*.png` files. Context, cookies and browser profiles must not be
  saved there. No file-copy permission or additional source root is needed.
- The agent uses one standalone Playwright CLI command per shell call; shell
  functions, loops, pipes and copy helpers are not supported. Denied commands
  must be disclosed, not retried with alternate shell constructions. Typing into
  search, opening results and mobile-menu interactions must actually happen to
  count as tested; uninspected screenshots are not passing visual comparisons.
- Safe-output requests are processed after the agent exits. A queued upload is
  not confirmed artifact publication. Reports use the returned temporary artifact
  reference for publisher resolution and stay Partial while evidence is pending
  or unverified. Check the actual run artifacts, not just its green status.

## Development and validation

Use gh-aw **v1.2.2** (the version used to compile this workflow) or a compatible
newer release. The v1.2.2 setup action is pinned to commit
`53d0749e19424a918acd82b4d140264ce48f2f14`. From the repository root:

```bash
# Dependency-free fixtures execute the workflow's actual inline preflight.
dotrun exec node --test .github/tests/auto-qa.test.cjs

# Strict validation and regeneration; commit the generated lock alongside source.
gh aw compile auto-qa --strict --action-mode action \
  --action-tag 53d0749e19424a918acd82b4d140264ce48f2f14
```

The path-filtered **Auto QA workflow tests** CI workflow runs these fixtures without
installing application dependencies. Fixtures cover ready/missing/stale/spoofed
and failed demos, superseded deployments, closed/unlabeled/fork PRs, API errors,
missing patches/QA text, changed heads, disabled diagnostic issue creation, and
telemetry isolation in the compiled workflow. They do not execute the AI prompt or
verify live browser results.

For the first live smoke test, label a low-risk UI PR with a ready demo. Verify the
report records real interactions and comparable screenshot pairs, inspect the
artifact yourself, and check that changing the PR head during QA prevents a pass.
Also try a missing-demo case (Blocked), and a PR with no QA section
(regression-only). Do not treat compilation/fixtures as proof of end-to-end
browser, Copilot, artifact-upload, or comment-publication behavior.

## Pre-merge smoke result (draft PR #5974)

The temporary harness at revision
[`91ceab4fa998500bcd9973c89499b15d4efb1a3b`](https://github.com/canonical/snapcraft.io/commit/91ceab4fa998500bcd9973c89499b15d4efb1a3b)
ran the production prompt pinned to `e3b28200bd66b2ffd1fd0ba609711206915236b7`.
The [current-head demo deployment](https://github.com/canonical/snapcraft.io/actions/runs/42894538578)
succeeded. The [smoke workflow](https://github.com/canonical/snapcraft.io/actions/runs/42896360140)
started Copilot and Playwright, passed threat detection, and published an
[advisory Partial report](https://github.com/canonical/snapcraft.io/pull/5974#issuecomment-6778757229).
It did not test the normal trusted-base prompt loader; that source was not yet on
main. The temporary harness and contract tests have served their purpose and
are removed from the final candidate.

Logs show browser navigation and twelve screenshot captures across `/`,
`/store`, `/search?q=firefox`, and `/firefox`, with six image-view calls. The agent
reported desktop and mobile observations, but skipped typing into search,
opening a result, mobile-menu, overflow and keyboard-focus checks. Screenshot
files were not preserved as a user-downloadable evidence artifact, so those
images could not be independently inspected after the run.

**The green workflow status was not an end-to-end pass.** Uploading from the old
`/tmp/gh-aw/agent/auto-qa/evidence` directory was rejected as outside allowed source
roots. Copy attempts were denied by the restricted shell, and a later filter-only
request matched no staged files. No `auto-qa-evidence` artifact exists for that
run; the published comment's artifact-availability wording must not be relied on.
The local staging/prompt regressions address those failures, but have not had a
second live test. One smoke activation was used; another needs explicit approval.

The harness also tightened the CLI proxy image to its existing manifest digest.
The v1.0.1 compiler emitted a tag-only `CLI_PROXY_IMAGE` in the normal lock, whose
image downloader does not reliably fail on an unsuccessful tag alias. The local
candidate is regenerated with v1.2.2, which emits the direct manifest digest;
there is no hand-edit to generated YAML. This scoped runtime update also brings
MCP Gateway v0.5.6 and firewall v0.29.11 with their generated digest pins. Other
repository workflows are unchanged. Strict compilation, Actionlint, ShellCheck
and fixtures validate the local candidate, not its hosted behavior. The successful
smoke startup used the older runtime plus the harness's one-off proxy pin; it
does not validate this regenerated runtime.
