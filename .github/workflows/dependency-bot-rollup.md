---
emoji: 🤖
description: Weekly/manual rollup of open Dependabot and Renovate PRs into one consolidated dependency PR.
on:
  schedule: weekly
  workflow_dispatch:
permissions:
  contents: read
  issues: read
  pull-requests: read
  copilot-requests: write
concurrency:
  group: dependency-bot-rollup
  cancel-in-progress: false
checkout:
  fetch-depth: 0
  fetch: ["refs/pulls/open/*"]
tools:
  github:
    mode: gh-proxy
    toolsets: [default]
safe-outputs:
  create-pull-request:
    draft: false
    close-older-pull-requests: true
    close-older-key: dependency-bot-rollup
    signed-commits: false
    patch-format: bundle
    if-no-changes: warn
    allowed-files:
      - "package.json"
      - "**/package.json"
      - "yarn.lock"
      - "**/yarn.lock"
      - "requirements.txt"
      - "**/requirements.txt"
---

# Dependency bot rollup

## Task

Create a single rollup branch and pull request from all currently open dependency bot pull requests.

1. Determine the repository default branch.
2. Use the available authenticated GitHub tooling to request `GET /repos/${{ github.repository }}/pulls?state=open&per_page=100`. Follow every REST `Link` header's `rel="next"` URL until no next page remains, keeping requests scoped to `${{ github.repository }}`. Collect all open PRs before filtering REST `user.login` exactly for `dependabot[bot]` or `renovate[bot]`, and capture each matched PR's number and `head.sha`.
   - Do not use `gh pr list --json author` for this filter: its `author.login` represents these bots as `app/dependabot` and `app/renovate`, not the REST bot logins.
3. For each bot PR, request `GET /repos/${{ github.repository }}/pulls/<number>/files?per_page=100` and follow all pagination before determining eligibility. Use `GET /repos/${{ github.repository }}/pulls/<number>` to verify that `head.sha` still matches the captured SHA and the file list length matches `changed_files`; otherwise stop with an error. Retain only PRs that exclusively update NPM/PyPI dependency files in this repository (`package.json`, `yarn.lock`, `requirements.txt`, including these basenames in subdirectories). Check both `filename` and `previous_filename` for renames; exclude PRs with any other paths or no changed files. If the API's file-list limit prevents complete inspection, stop with an error rather than treating the PR as eligible or the result as empty.
   - Report the total open PR count, bot-matched count before file filtering, and eligible PR count after file filtering. Report every excluded bot PR number and its reason, including disallowed paths.
4. Sort by pull request number ascending.
5. Only after discovery and file inspection have completed successfully for every page, if there are no matching pull requests after filtering, call `noop` with the counts and a short reason.
6. Create a branch from the default branch named `chore/dependency-bot-rollup/<YYYY-MM-DD>-${{ github.run_id }}`.
7. For each dependency bot pull request:
   - locate its prefetched local ref at `refs/remotes/origin/pull/<number>/head`; do not fetch over the network,
   - verify that the local ref exists and matches the head SHA used when filtering the PR; otherwise call `noop` with the PR number and reason,
   - merge it into the rollup branch with a merge commit,
   - if there are conflicts, abort the merge and call `noop` with the blocked PR number; do not resolve conflicts by choosing either side and do not create a partial rollup,
   - stop processing immediately after calling `noop`.
8. Verify that the final dependency files preserve the selected updates. If any selected update is missing or cannot be verified, call `noop` with the affected PR numbers and stop without creating a rollup PR.
9. If the rollup branch ends with no net file changes versus default branch, call `noop`.

For any API/tool failure during discovery or file inspection (including authentication, permissions, rate limits, pagination, or malformed/incomplete responses), report the failed operation and error and stop as a failure. Never substitute an empty list, skip a failed page or PR, or call `noop` for these failures.

## Rerun behavior

When this workflow runs again while a previous rollup PR from this same workflow is still open:

- treat the previous rollup PR as superseded,
- close the previous rollup PR,
- and open a brand-new rollup PR for the latest run.

Do not reuse or update an existing open rollup PR in place.

## Dependency update summary requirements

Build a grouped summary from the final dependency diff against the default branch, using the merged bot PRs for attribution. Do not report an update unless it is present in the final files.

- Include, for each update:
  - package name,
  - previous version,
  - new version,
  - source bot PR number.
- Infer ecosystem from changed files when needed.
- Group output by ecosystem (NPM and PyPI).
- If exact versions cannot be extracted for an item, use `unknown` for missing values.

Use this list format under `## Done`:

- `Updated the following <ECOSYSTEM> dependencies:`
- `- <package> : <old-version> --> <new-version> (#<pr-number>)`

## Pull request output requirements

Create exactly one PR using `create-pull-request`.

- Title: `chore(deps): roll up dependency bot updates`
- Base branch: default branch
- The PR description **must follow the repository template structure in `.github/pull_request_template.md`**, preserving all section headings and order.
- Fill the `## Done` section with the grouped dependency summary described above.
- In `## How to QA`, use this exact intent:
  1. Verify all GitHub Actions checks for the rollup PR pass.
  2. Verify the demo environment deployed from the PR branch behaves correctly.
- State that these two checks are the primary regression gate for dependency updates.
- In `## Testing`, mark no-testing-required with a short explanation that validation is performed via CI checks and demo verification.

## Safe Outputs

- Use `create-pull-request` for the final PR. It is configured to close older open rollup PRs from this workflow before creating the new one.
- Use `noop` when there are no bot PRs, no net changes, or merges are blocked by unresolvable conflicts.
