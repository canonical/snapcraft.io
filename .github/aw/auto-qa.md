# Automated browser QA

Auto QA checks a PR's demo in a browser and posts a report with screenshots.


## Run QA

1. Add clear `## How to QA` steps to the PR description.
2. Wait for the controller's `github-actions[bot]` comment to say **PR demo: ready**
   and for the linked **PR demo** workflow to succeed for the latest commit.
3. Add the **auto-qa** label.
4. Check the **Auto QA preflight** run summary. If checks block or skip the run,
   the reason appears there; no PR comment is posted. Otherwise, read the browser
   QA report on the PR. **Partial** and **Blocked** do not mean the checks passed.
5. Expand each viewport's `<details>` section to see production and demo
   screenshots side by side in a table, including passing and uncertain checks. PNGs are uploaded individually,
   without a ZIP, and kept for 14 days unless repository settings override this.
   Images stop being available when their artifacts expire.

To retry, remove and re-add the label once the latest commit's demo is ready.
New commits and comments do not trigger QA. A new `auto-qa` label event cancels
any previous QA run for that PR, and new reports collapse older ones. Other label
additions produce skipped runs in separate concurrency groups; they do not cancel
QA already in progress.

## Limits and safety

- Without usable QA steps, the agent chooses checks based on the diff. It does
  not provide exhaustive test coverage or automated pixel-diff results.
- The browser is not logged in. Steps requiring authentication or unsafe actions
  are reported as blocked, not executed. The agent must not submit forms, make
  purchases, publish content or perform destructive actions.
- Only the validated demo and production site may be browsed. PR content and
  pages are untrusted; the agent must not run PR code or commands from them.
- Comparisons use live production, which may differ from the PR's base commit.
- The workflow checks the demo and PR commit before starting. The agent must
  check again before reporting; changed or unverifiable context blocks the result.
- Network restrictions and threat detection provide safeguards, but browser
  restrictions also depend on the agent following instructions.
- Both browser sessions use a trusted Playwright config to disable background
  networking, component updates, and network-time queries. This aims to reduce
  unrelated Chromium requests to Google; it does not allowlist those services or
  filter firewall warnings/logs. Suppression still needs hosted verification.
- Each screenshot upload declares its image ID explicitly; an acknowledgement
  containing only `output_id` is normal, not a reason to omit the image. Single
  files are staged under their basenames, so the PNG allowlist uses the expected
  desktop/mobile and production/demo filename suffixes, not the source directory.
  An upload request does not prove publication: the publisher resolves the
  declared IDs after upload, and missing/failed uploads must be disclosed.

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

The **Auto QA workflow tests** CI job tests the preflight, report/image-reference
contracts, and the exact pinned screenshot publisher against flattened staging
files. GitHub uploads and inactive queue-claim hooks are stubbed; the real file
selector, allowlist, archive options and temporary-ID handling run without network
writes.
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
captured four PNGs but failed to publish all four because single-file staging
flattened their paths while the allowlist required the source directory. Its
upload calls also omitted declared image IDs, and the report followed the old
failure-only table rule. The basename allowlist, explicit upload IDs and all-result
comparison tables now have local regression coverage, not a new hosted test.
