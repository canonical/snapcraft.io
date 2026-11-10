# Temporary pre-merge Auto QA smoke test

**Remove the temporary harness and its test file before requesting review or
merging.** Production `auto-qa.md` and `auto-qa.lock.yml` are unchanged.

## Why a harness is needed

The label-triggered production workflow loads its prompt from the trusted PR base
commit. In PR #5974 the source is new, so that commit does not contain it. The
first hosted attempt failed before the agent started; compilation alone did not
reveal this pre-merge limitation.

`../workflows/auto-qa-smoke.yml` is an ordinary Actions workflow copied from the
reviewed normal lock at commit
`e3b28200bd66b2ffd1fd0ba609711206915236b7`. Its only executable differences are:

- The test pre-activation gate requires repository `canonical/snapcraft.io`, PR
  **5974**, branch **feat/auto-qa-pr-browser-checks**, and adding **auto-qa-smoke**.
  The existing actor-role and open/same-repository checks are retained. The
  original **auto-qa** label must also remain present for the unchanged preflight
  and report-output guard.
- Activation's sparse metadata checkout uses that literal reviewed commit instead
  of the PR base commit. It never uses the untrusted head/merge ref or checks out
  application source. Both normal source and lock SHA-256 values are verified
  before prompt loading. This is a deliberately different test-only loader,
  **not a test of the production base-commit loader**.
- Display/run names and top-level concurrency identify the smoke test. The
  unchanged conclusion job still shares the production conclusion concurrency.
- The CLI proxy is launched using the existing manifest's full image digest,
  instead of relying on the downloader's mutable tag alias. Review of the pinned
  setup action found that failed alias tagging is not guaranteed to fail the
  download helper. This test-only tightening does not fix that upstream compiler
  behavior in the unchanged production lock.

Apart from that explicit proxy digest pin, the agent job, deployment preflight,
prompt, Playwright version, container/action pins, permissions, credential
plumbing, network/firewall, inference budgets,
fail-closed threat detection, telemetry suppression, diagnostic issue suppression,
and PR-scoped safe outputs are copied without changes. Internal gh-aw identities
still name the production source, intentionally: it is that exact source which
is being executed and hash-checked. Download the evidence from the smoke run,
not the previous failed production activation.

## Bounded live test

1. Publish the reviewed harness revision to the existing draft PR. This starts
   the existing demo workflow for the new head; keep the PR draft and request no
   review. Do not merge or alter repository credentials/settings.
2. Wait for the controller's current-head **PR demo: ready** comment and a
   successful demo run. Do not substitute the legacy `demos.haus` URL.
3. Add **auto-qa-smoke** once. Verify the run SHA matches the reviewed remote head,
   the immutable-source checks pass, and the unchanged preflight accepts the demo.
4. Check actual agent/browser execution, paired screenshots, detection, artifact
   publication, and the single advisory PR report. A successful Actions status
   without those effects does not establish a successful browser QA test.
5. Record the exact tested head, source commit, run links, observed coverage,
   limitations, and screenshots. Do not claim that production activation was
   exercised before its source exists on the trusted base branch.

One fresh demo deployment and one smoke execution are authorized for this test.
The existing 30-minute agent-step timeout and 1000/400 AIC main/detector defaults
remain unchanged. Those defaults can be overridden by gh-aw repository or
organization variables; this test does not authorize increasing them. No automatic rerun/relabel loops or credential/permission workarounds.
Stop on access denial or a moved/unreviewed revision. Any executable changes need
review before a further run.

## Validation and cleanup

```bash
dotrun exec node --test .github/tests/auto-qa.test.cjs .github/tests/auto-qa-smoke.test.cjs
gh aw lint --shellcheck .github/workflows/auto-qa-smoke.yml
```

The temporary contract test checks the entire harness against the pinned normal
lock, allowing only the seven explicitly enumerated text substitutions. It also
checks production source hashes, matches the proxy digest to the manifest, and
checks unchanged runtime bodies except for that one proxy pin.

After recording the result, remove `auto-qa-smoke.yml`, `auto-qa-smoke.test.cjs`,
and this temporary guide from the PR's final changes, and remove the smoke label
from PR #5974. Keep evidence/results in the draft PR description. Removing these
files does not change the production source/lock or validate its base-loader path.
