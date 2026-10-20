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
2. List open pull requests where `author.login` is either `dependabot[bot]` or `renovate[bot]`.
3. Filter to PRs that only update NPM/PyPI dependency files in this repository (`package.json`, `yarn.lock`, `requirements.txt`).
4. Sort by pull request number ascending.
5. If there are no matching pull requests after filtering, call `noop` with a short reason.
6. Create a branch from the default branch named `chore/dependency-bot-rollup/<YYYY-MM-DD>-${{ github.run_id }}`.
7. For each dependency bot pull request:
   - fetch the PR head branch,
   - merge it into the rollup branch with a merge commit,
   - if there are conflicts, resolve them by preferring the incoming dependency-bot side for conflicted files,
   - complete the merge commit.
8. If a conflict cannot be resolved cleanly after attempting the strategy above, call `noop` with a short reason that includes the blocked PR number.
9. If the rollup branch ends with no net file changes versus default branch, call `noop`.

## Rerun behavior

When this workflow runs again while a previous rollup PR from this same workflow is still open:

- treat the previous rollup PR as superseded,
- close the previous rollup PR,
- and open a brand-new rollup PR for the latest run.

Do not reuse or update an existing open rollup PR in place.

## Dependency update summary requirements

Build a grouped summary of dependency updates from the merged bot PRs.

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
