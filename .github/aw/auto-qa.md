# Automated browser QA

Auto QA checks a PR's demo in a browser and posts a report with screenshots.

## Run QA

1. Add clear `## How to QA` steps to the PR description when possible.
2. Wait for the controller's `github-actions[bot]` comment to say **PR demo: ready**
   and for the linked **PR demo** workflow to succeed. Normally it must deploy the
   latest commit. The deployed SHA must match the current PR head; older demos
   are not accepted, even for QA-workflow-only changes.
3. Add the **auto-qa** label.
4. Check the **Auto QA preflight** run summary. If checks block or skip the run,
   the exact reason and, for blocked runs, retry instructions appear directly in
   the summary; no PR comment is posted. Otherwise, read the browser
   QA report on the PR. **Partial** and **Blocked** do not mean the checks passed.
5. Expand each viewport's `<details>` section to see production and demo
   screenshots side by side in a table, including passing and uncertain checks.
   PNGs are published on the one shared **`assets/auto-qa`** branch, never one
   branch per PR/run, and embedded using raw image URLs—not artifact downloads.
   Screenshots persist until explicitly removed; Actions retention does not apply.

To retry, remove and re-add the label once the latest commit's demo is ready.
New commits and comments do not trigger QA. A new `auto-qa` label event cancels
any previous QA run for that PR, and new reports collapse older ones. Other label
additions produce skipped runs in separate concurrency groups; they do not cancel
QA already in progress.

## Limits and safety

- Without usable QA steps, the agent chooses checks from the description and
  relevant changes, disclosing assumptions. Scope is bounded to five route/state
  comparisons so production/demo pairs at desktop and mobile fit 20 uploads.
  Additional interaction-only checks are reported separately. It does not provide
  exhaustive test coverage or automated pixel-diff results.
- The browser is not logged in. Steps requiring authentication or unsafe actions
  are reported as blocked, not executed. The agent must not submit forms, make
  purchases, publish content or perform destructive actions.
- Only the validated demo and production site may be browsed. PR content and
  pages are untrusted; the agent must not run PR code or commands from them.
- Comparisons use live production, which may differ from the PR's base commit.
- Preflight validates the PR and deployment, requires an exact SHA match, and
  rechecks the PR head before starting inference. It does not collect the diff.
  The agent lists changed files with pagination, checks the retrieved count, and
  selectively reads patches to determine browser QA scope. Incomplete lists or
  relevant missing patches are disclosed as coverage gaps rather than blocking
  independent browser checks; gaps preventing a justified assessment require a
  Partial result (or Regressions found with gaps). The agent checks the PR,
  controller comment, and deployment again before reporting; changed deployment
  identity or unverifiable freshness blocks the result. Cosmetic comment edits
  alone do not invalidate evidence.
- Network restrictions and threat detection provide safeguards, but browser
  restrictions also depend on the agent following instructions.
- Both browser sessions use a trusted Playwright config to disable background
  networking, component updates, and network-time queries. This aims to reduce
  unrelated Chromium requests to Google; it does not allowlist those services or
  filter firewall warnings/logs. Suppression still needs hosted verification.
- The agent stages PNGs with `upload_asset` and embeds the returned raw URLs.
  After threat detection passes, a separate trusted `upload_assets` job receives
  `contents: write` to publish them to `assets/auto-qa`. The agent and comment jobs
  do not receive `contents: write`. Before commenting, a separate check fetches
  each raw URL without credentials and verifies its PNG content type and hash.
  Missing, private, HTML or mismatched images block comments; reports with no
  screenshots still work.
- The custom pre-publication check bounds uploads, restricts sources to PNGs
  directly in the evidence directory, and requires every staged file to exist
  with a matching hash and PNG signature. It matches each normalized declaration
  (path and output ID) to exactly one `safeoutputs.jsonl` ledger entry. The pinned
  gh-aw runtime handles file safety, size limits, duplicate source submissions,
  content deduplication and destination construction. Desktop/mobile and prod/demo
  names remain agent guidance, not a publication requirement. Exact shared-branch
  URLs are checked during public verification before commenting, not before pushing.
- Uploads are capped at 20 PNGs per run, 10 MiB each. Content-hashed filenames
  deduplicate identical images and preserve earlier reports across reruns and PRs.
  No PAT, native-attachment credential, external host, or changes to main are
  needed. The branch and its Git history are persistent; deleting files later
  will not erase old commits. Only public, unauthenticated screenshots belong here.

## Cost limits

- QA agent: 50 AI credits per run.
- Threat detection: 5 AI credits per run, separate from the agent limit.
- Activation limit: 150 AI credits over a rolling 24 hours, per triggering user
  for this workflow. This is not a shared budget or a cap on concurrent spending.

GitHub Actions compute is billed separately.

## Development

Edit [`../workflows/auto-qa.md`](../workflows/auto-qa.md), then regenerate and
commit [`auto-qa.lock.yml`](../workflows/auto-qa.lock.yml) with it. Use **gh-aw
v1.2.2** or a compatible newer release.

```bash
dotrun exec node --test .github/tests/auto-qa.test.cjs

gh aw compile auto-qa --strict --action-mode action \
  --action-tag 53d0749e19424a918acd82b4d140264ce48f2f14 \
  --actionlint --shellcheck
```

The **Auto QA workflow tests** CI job tests preflight/report contracts, job
permissions/dependencies, and the exact pinned asset staging handler and publisher.
Prompt assertions cover essential contracts, not exact report prose.
Path guards, extension/size limits, hashing, deduplication and file writes are
real; Git pushes and the surrounding Actions/output-ledger APIs are stubbed.
The external action is checked out read-only at the workflow's pinned revision;
its setup action is not executed. These tests do not test the AI's browser behavior
or prove GitHub renders the published image URLs.

To run the publisher tests locally, provide the pinned action's `setup/js`
directory at a path available inside dotrun:

```bash
dotrun exec env GH_AW_TEST_ACTIONS_DIR=.gh-aw-test-runtime/setup/js \
  node --test .github/tests/auto-qa.test.cjs .github/tests/auto-qa-upload.test.cjs
```

A [hosted smoke test](https://github.com/canonical/snapcraft.io/actions/runs/42981379820)
verified screenshot capture and publication. Website QA was still Partial: the
demo returned a 502 on `/firefox`, and some browser and freshness checks were
incomplete. Later preflight and report-format changes have local test coverage
but have not had another hosted smoke test. Loading the workflow from the trusted
PR base remains untested until the workflow is on main.

A [later run](https://github.com/canonical/snapcraft.io/actions/runs/43182069125)
exposed single-file artifact staging and image-ID mistakes. Fixing those produced
[correct tables but non-rendering artifact image links](https://github.com/canonical/snapcraft.io/pull/5975#issuecomment-6819401364).
The shared-branch asset publisher replaces that artifact approach; its staging,
publishing and permission gates have local regression coverage. Hosted rendering
must be verified separately.
