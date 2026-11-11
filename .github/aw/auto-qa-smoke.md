# Temporary second pre-merge Auto QA smoke test

Remove this guide, `../workflows/auto-qa-smoke.lock.yml`, and
`../tests/auto-qa-smoke.test.cjs` from the final PR before requesting review or
merging. This harness deliberately does not test the trusted-base prompt loader.

## Immutable inputs

The harness is copied from the production lock at
`d128f79f4a2dcf3e11c67fff667b91d300560e8a` (gh-aw v1.2.2):

- Source SHA-256: `935fba0be4a879883f8c74a5aec1a3717f87521b14432c8cdb574229bcebfcff`
- Normal lock SHA-256: `00d06ae0a0a438fdb87fb9d5839f93cacad8d66c136cfd5eaa365d435799500d`

Only six transformations are permitted and tested: explanatory header, workflow
name, top-level concurrency/run name, metadata checkout at the literal source
commit, static checksum verification before loading the prompt, and preactivation
restricted to repository `canonical/snapcraft.io`, PR **5974**, branch
**feat/auto-qa-pr-browser-checks**, and adding **auto-qa-smoke**.

The original **auto-qa** label remains required. Actor-role checks, permissions,
credentials and their destinations, network/firewall, prompt, deployment preflight,
Playwright version, generated container/action pins, diagnostic issue suppression,
telemetry isolation, fail-closed detection, and safe outputs are unchanged.
Agent, detection, and safe-output job bodies are byte-identical to the normal lock.
The executing filename must end in `.lock.yml`: v1.2.2 validates that suffix when
loading compiler metadata. Renaming a normal Actions `.yml` harness is necessary;
spoofing the executing identity or disabling metadata validation is not.
The CLI proxy already uses a direct digest in the v1.2.2 normal lock; no additional
runtime substitution is needed. The conclusion queue remains shared with Auto QA.

## Bounded test and acceptance

The user explicitly requested pushing the fixes and testing again. Publish the
source commit and harness commit together on the existing draft PR. This starts
one fresh demo deployment at the final branch head; keep the PR draft and request
no review or merge. Do not change secrets, settings, credentials or permissions.

After the latest current-head demo succeeds and its controller comment says ready,
add **auto-qa-smoke** once. Verify the run SHA and source-checksum step. Monitor the
demo for at most 30 minutes and QA for at most 45 minutes, polling no faster than
30 seconds. Preserve the 30-minute agent-step timeout and 1000/400 main/detector
AIC defaults; no increases are authorized. Do not rerun or relabel on failure,
access denial, unknown dispatch outcome, or branch movement.

Acceptance needs genuine browser interactions and image inspections, not only a
green Actions run. Confirm `auto-qa-evidence` actually exists, download the PNGs,
inspect matching demo/production images, and read the published PR report. Check
search typing/result opening and mobile navigation, and disclose any gaps. A
queued upload request alone is not publication. No state-changing website actions.

Record the exact head/source revisions, deployment and QA run URLs, artifact URL,
PNG names and observed report status. Remove the smoke label from PR5974 after
collecting the result. Clean up the temporary files before the final PR is ready;
do not broaden a one-run authorization into repeated attempts.

## Local validation

```bash
dotrun exec node --test .github/tests/auto-qa.test.cjs .github/tests/auto-qa-smoke.test.cjs
# Use gh-aw v1.2.2, not the older globally installed extension.
gh aw lint --shellcheck .github/workflows/auto-qa-smoke.lock.yml
```

## Second hosted attempt

The [new demo](https://github.com/canonical/snapcraft.io/actions/runs/42974205709)
succeeded at `b54ef4479bdbc0a053b44de2324c6992a371582e`. The
[smoke attempt](https://github.com/canonical/snapcraft.io/actions/runs/42975116262)
failed before the checksum checkout or agent startup: v1.2.2's compiler metadata
loader rejected the executing `auto-qa-smoke.yml` filename because it accepts
only `.lock.yml` identities. The actual workflow ID and immutable SHA were present;
this was not missing credentials or an application/demo failure.

The local candidate renames the harness to `auto-qa-smoke.lock.yml` without
changing its bytes, records the filename contract in the fixtures, and retains
all metadata validation. The smoke label was removed after the failure. The user
subsequently requested **fix and retry**, authorizing one fresh deployment and
one retry of the renamed harness with the same scope, time and spend bounds.
No automatic relabel/retry loop is authorized.
