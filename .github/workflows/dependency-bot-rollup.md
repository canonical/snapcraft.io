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
runtimes:
  node:
    version: "24"
network:
  allowed:
    - registry.npmjs.org
    - registry.yarnpkg.com
  blocked:
    - api.npms.io
    - bun.sh
    - cdn.jsdelivr.net
    - deb.nodesource.com
    - deno.land
    - esm.sh
    - get.pnpm.io
    - googleapis.deno.dev
    - googlechromelabs.github.io
    - jsr.io
    - nodejs.org
    - npm.pkg.github.com
    - npmjs.com
    - npmjs.org
    - registry.bower.io
    - registry.npmjs.com
    - repo.yarnpkg.com
    - skimdb.npmjs.com
    - storage.googleapis.com
    - telemetry.vercel.com
    - www.npmjs.com
    - www.npmjs.org
    - yarnpkg.com
steps:
  - name: Install repository-compatible Yarn Classic
    run: npm install --global --ignore-scripts yarn@1.22.22
tools:
  github:
    mode: gh-proxy
    toolsets: [default]
safe-outputs:
  steps:
    - name: Block PR side effects for incomplete rollups
      if: contains(needs.agent.outputs.output_types, 'create_pull_request')
      env:
        AGENT_OUTPUT: ${{ steps.setup-agent-output-env.outputs.GH_AW_AGENT_OUTPUT }}
      run: |
        if ! jq -e '(.items | type == "array") and all(.items[]; .type != "report_incomplete")' "$AGENT_OUTPUT"; then
          echo "::error::Rollup incomplete or output invalid; refusing PR creation and supersession"
          exit 1
        fi
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
   - record the selected manifest changes and lockfile entry changes against the PR's merge base (including selector, version, resolved URL and integrity for lockfile-only updates); retain these expectations and the original lockfile blobs outside the checkout until final verification,
   - merge it into the rollup branch with `git merge --no-ff --no-edit`,
   - if the merge exits nonzero, inspect the actual unmerged paths with `git diff --name-only --diff-filter=U -z` and confirm `MERGE_HEAD` exists. No unmerged paths or no active merge means a Git/tool error, not a tolerable conflict: call `report_incomplete` with diagnostics and stop,
   - only a regular, tracked Yarn Classic v1 `yarn.lock` with a verified owning `package.json` (or Yarn workspace root) is a recognized generated dependency lockfile, including eligible nested packages. Do not generalize to `*.lock` or `*.lock.yml`: the compiled workflow is not a dependency lockfile. `package.json` and `requirements.txt` are never disposable lockfiles. Unsupported formats, symlinks, missing owners, renames/deletions or ambiguous workspace ownership are blocked,
   - if ANY unmerged path is not such a lockfile, abort the entire merge and call `noop` with the blocked PR number and paths. This includes mixed manifest/lockfile conflicts; never choose either side for a manifest or publish a partial rollup,
   - for lockfile-only conflicts, save index stages 1/2/3 outside the checkout before resolving. Record every affected lockfile and its owner in a regeneration set that persists across ALL merges. Use the stage-2 blob as a **temporary** working-tree placeholder, stage only those paths, verify `git ls-files -u` is empty, and immediately commit the active merge with `git commit --no-edit`. Do not reset/abort/recreate the merge: it must retain both parents, including the verified bot PR head. Temporary contents are not a final resolution,
   - stop processing immediately after calling `noop`.
8. After **all** selected PRs have merged, regenerate and verify lockfiles before building any summary or requesting any PR:
   - Add the owning lockfile for every changed Yarn dependency input (`dependencies`, `devDependencies`, `optionalDependencies`, `resolutions`, and workspace manifests) to the regeneration set, even when its merge was clean. Regenerate each workspace root once, not individual workspace members; independent nested packages run in their own directories. If ownership or a required lockfile cannot be established, call `noop` and stop.
   - Build a valid v1 seed for each affected lockfile from the saved blobs and final cleanly merged entries, retaining unrelated entries and incorporating ALL selected lockfile entry updates, including lockfile-only bot updates. Do not simply delete the lockfile, keep the temporary side, or run a blanket upgrade. If two selected updates require incompatible resolutions for the same selector, or the seed cannot preserve an update, call `noop` with the affected PRs and stop.
   - Use Node 24 and Yarn **1.22.22** (the repository uses Classic v1 locks, not Berry; `--immutable` is not a regeneration command). In each owning package/workspace directory run `yarn install --ignore-scripts --non-interactive` against the final manifests and seeded lockfile. Do not run project/dependency lifecycle scripts, change manifests/configuration, bypass integrity/engine checks, or add registries/network permissions. Retain existing resolutions to avoid unrelated dependency churn.
   - Check each command's exit status explicitly. On ANY tool/seed-generation/install failure, call `report_incomplete` with the package directory, command, exit status and useful stderr, then stop immediately. NEVER convert regeneration failure to `noop`, retry by discarding updates, or emit `create-pull-request`. A shell tool's nonzero exit alone does not fail the agent: `report_incomplete` activates the compiled runtime's `core.setFailed` failure handling even if the agent exits zero. The safe-output preflight independently rejects incomplete output before PR creation can close an older rollup.
   - Verify all selected updates against the recorded expectations and final files, including manifests, resolutions and exact resolved lockfile entries for lockfile-only updates (not just merge ancestry). A later compatible update may supersede an earlier version only if it demonstrably includes that update; otherwise missing, incompatible or unverifiable selected updates require `noop` with the affected PRs and no PR.
   - Verify no `git ls-files -u` entries, no active `MERGE_HEAD`, no conflict-marker lines in dependency files, no unexpected file changes, and that every selected head is an ancestor of HEAD. Stage only successfully regenerated lockfiles and commit them if changed. Verify the final committed diff, a clean index/worktree (excluding ignored install artifacts), and that all changed dependency inputs have consistent lockfiles before proceeding.
9. Verify that the final dependency files preserve the selected updates. If any selected update is missing or cannot be verified, call `noop` with the affected PR numbers and stop without creating a rollup PR.
10. If the rollup branch ends with no net file changes versus default branch, call `noop`.

For any API/tool or consistency-check failure during discovery or file inspection (including authentication, permissions, rate limits, pagination, stale SHAs, or malformed/incomplete responses), call `report_incomplete` with the failed operation and error and stop. Never substitute an empty list, skip a failed page or PR, or call `noop` for these failures.

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
- Only generated Yarn lockfile conflicts may be deferred, and only until successful final regeneration and update verification. Use `report_incomplete`, never `noop`, for regeneration failures; do not request a PR or supersede an existing rollup on any incomplete run.
