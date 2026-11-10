import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const workflow = await readFile(
  new URL("../../workflows/auto-qa.md", import.meta.url),
  "utf8",
);
const policySource = workflow.match(
  /\/\/ QA_POLICY_START\n([\s\S]*?)\s*\/\/ QA_POLICY_END/,
)[1];
const { qa, hash, fresh, redact } = new Function(
  "createHash",
  `${policySource}\nreturn { qa, hash, fresh, redact };`,
)(createHash);
const sha = "a".repeat(40);
const pr = {
  state: "open",
  draft: false,
  head: { sha },
  body: "## How to QA\nUse the navigation to open the Store.\n## Testing\nNone",
  labels: [{ name: "auto-qa" }],
};
const deadline = Date.now() + 60_000;
const scenarios = JSON.parse(
  await readFile(new URL("fixtures/auto-qa/scenarios.json", import.meta.url)),
);

test("QA is natural language, with stable fenced-section hashing", () => {
  assert.equal(qa(pr.body), "Use the navigation to open the Store.");
  assert.equal(qa("## Done\nNo instructions"), "");
  assert.equal(qa(null), "");
  assert.equal(
    qa("## How to QA\r\n### Prerequisites\r\nNone\r\n## Testing"),
    "### Prerequisites\nNone",
  );
  assert.equal(
    qa("## How to QA\n```\n## Example\n```\nExplore related pages\n## Done"),
    "```\n## Example\n```\nExplore related pages",
  );
});

test("stale revisions, edited QA, removed labels and elapsed deadlines cannot publish", () => {
  assert.ok(fresh(pr, sha, hash(qa(pr.body)), deadline));
  for (const changed of [
    { head: { sha: "b".repeat(40) } },
    { body: "## How to QA\nDifferent steps" },
    { labels: [] },
    { state: "closed" },
  ])
    assert.equal(
      fresh({ ...pr, ...changed }, sha, hash(qa(pr.body)), deadline),
      false,
    );
  assert.equal(fresh(pr, sha, hash(qa(pr.body)), 0), false);
  assert.match(workflow, /script: &qa-context/);
  assert.match(workflow, /script: \*qa-context/); // Same policy gates capture and publication.
});

test("draft PRs can run QA and publish a fresh report", async () => {
  assert.ok(fresh({ ...pr, draft: true }, sha, hash(qa(pr.body)), deadline));
  assert.doesNotMatch(
    workflow,
    /pull_request\.draft|!pr\.draft|open\/non-draft/,
  );
  const { outputs } = await capture(pr.body, { draft: true });
  assert.equal(outputs.get("sha"), sha);
});

test("QA runs on PR labels without a privileged target trigger", () => {
  assert.match(workflow, /on:\n  pull_request:\n    types: \[labeled\]/);
  assert.doesNotMatch(workflow, /pull_request_target|acknowledge-risk/);
});

test("context redacts credentials and personal information", () => {
  assert.ok(
    !redact("email@example.com Bearer private secret=private").includes(
      "private",
    ),
  );
});

test("QA uses only the captured-SHA local build, without demo discovery", () => {
  assert.doesNotMatch(
    workflow,
    /function demo|attested|marketplace\.demos|listComments|candidate\.runId/,
  );
  assert.doesNotMatch(workflow, /outputs\.build|setOutput\('build'/);
  assert.match(
    workflow,
    /name: Setup isolated rock builder\n    continue-on-error/,
  );
  assert.match(workflow, /id: rock\n    continue-on-error/);
  assert.match(
    workflow,
    /TESTED_SHA: \$\{\{ steps\.context\.outputs\.sha \}\}/,
  );
  assert.match(workflow, /rev-parse HEAD\)" = "\$TESTED_SHA"/);
  assert.match(workflow, /cmp "\$GITHUB_WORKSPACE\/rockcraft\.yaml"/);
  assert.match(workflow, /ROCK_READY: \$\{\{ steps\.rock\.outputs\.ready \}\}/);
});

const captureSource = workflow.match(
  /script: &qa-context \|\n([\s\S]*?)\n  - name: Setup isolated rock builder/,
)[1];
async function capture(body = pr.body, changed = {}, guard = false) {
  const writes = new Map(),
    outputs = new Map();
  const event = { ...pr, number: 42, changed_files: 1, body };
  const files = [{ filename: "templates/store.html", patch: "+Updated UI" }];
  const listFiles = Symbol("listFiles");
  const execute = new Function(
    "require",
    "context",
    "github",
    "fetch",
    "process",
    "core",
    `return (async () => { ${captureSource} })();`,
  );
  await execute(
    (name) => {
      if (name === "node:crypto") return { createHash };
      assert.equal(name, "node:fs");
      return {
        mkdirSync() {},
        writeFileSync: (path, data) => writes.set(path, data),
      };
    },
    {
      payload: { pull_request: event },
      repo: { owner: "canonical", repo: "snapcraft.io" },
      runId: 123,
    },
    {
      rest: {
        pulls: {
          get: async () => ({ data: { ...event, ...changed } }),
          listFiles,
        },
      },
      paginate: async (method) => {
        assert.equal(method, listFiles);
        return files;
      },
    },
    async () => ({
      ok: true,
      json: async () => ({ created_at: new Date().toISOString() }),
    }),
    {
      env: {
        QA_GUARD: String(guard),
        GITHUB_API_URL: "https://api.github.com",
      },
    },
    { setOutput: (key, value) => outputs.set(key, value) },
  );
  return { writes, outputs };
}

test("capture pins the local build and selects QA-and-regression mode when QA is present", async () => {
  const { writes, outputs } = await capture();
  const snapshot = JSON.parse(writes.get("/tmp/gh-aw/qa/context.json"));
  assert.equal(snapshot.sha, sha);
  assert.equal(snapshot.target, null);
  assert.equal(snapshot.qa, qa(pr.body));
  assert.equal(snapshot.mode, "qa-and-regression");
  assert.equal(snapshot.diff[0].filename, "templates/store.html");
  assert.equal(outputs.get("sha"), sha);
  await assert.rejects(
    capture(pr.body, { head: { sha: "b".repeat(40) } }),
    /Superseded/,
  );
  const guarded = await capture(pr.body, {}, true);
  assert.equal(guarded.writes.size, 0);
  assert.equal(guarded.outputs.size, 0);
});

test("missing and empty QA still capture a local build revision in regression-only mode", async () => {
  for (const body of [
    null,
    "",
    "No QA section",
    "## How to QA\n  \n## Testing\nNone",
  ]) {
    const { writes, outputs } = await capture(body);
    const snapshot = JSON.parse(writes.get("/tmp/gh-aw/qa/context.json"));
    assert.equal(outputs.get("sha"), sha);
    assert.equal(snapshot.qa, "");
    assert.equal(snapshot.mode, "regression-only");
    assert.equal(snapshot.diff[0].filename, "templates/store.html");
  }
  await assert.rejects(
    capture("No QA section", { body: pr.body }),
    /Superseded/,
  );
  assert.match(workflow, /Missing\/empty QA selects \*\*regression-only\*\*/);
  assert.match(workflow, /not a\n\s+request-only response or a skipped run/);
  assert.match(
    workflow,
    /missing QA instructions limited the run to regressions/,
  );
  assert.doesNotMatch(
    workflow,
    /Missing QA instructions; local build skipped|produce a request for actionable instructions/,
  );
  assert.match(
    scenarios.find(({ id }) => id === "missing-qa").expected,
    /regression-only/,
  );
});

// Exercise the actual trusted snippet passed to playwright-cli, without a
// custom browser runner or any real network/credentials.
const preparation = workflow
  .match(/node --input-type=module <<'JS'\n([\s\S]*?)\n\s*JS/)[1]
  .replace(/^\s*import .*\n/m, "");
function prepare(ready, instructions = qa(pr.body)) {
  const writes = new Map();
  new Function("readFileSync", "writeFileSync", "process", preparation)(
    () =>
      JSON.stringify({
        baseline: "https://snapcraft.io",
        target: null,
        qa: instructions,
      }),
    (path, data) => writes.set(path, data),
    { env: { ROCK_READY: ready } },
  );
  return writes;
}
const writes = prepare("true");

test("only a ready local rock becomes the browser target", () => {
  const ready = JSON.parse(writes.get("/tmp/gh-aw/qa/context.json"));
  assert.equal(ready.target, "http://host.docker.internal:8004");
  assert.match(ready.blocked, /no backend egress/);
  for (const status of [undefined, "false", ""]) {
    const blocked = JSON.parse(
      prepare(status).get("/tmp/gh-aw/qa/context.json"),
    );
    assert.equal(blocked.target, null);
    assert.match(blocked.blocked, /build\/start unavailable/);
  }
  const missing = JSON.parse(
    prepare("true", "").get("/tmp/gh-aw/qa/context.json"),
  );
  assert.equal(missing.target, "http://host.docker.internal:8004");
  assert.match(missing.blocked, /no backend egress/);
  const unavailable = JSON.parse(
    prepare(undefined, "").get("/tmp/gh-aw/qa/context.json"),
  );
  assert.equal(unavailable.target, null);
  assert.match(unavailable.blocked, /build\/start unavailable/);
});
const guard = vm.runInNewContext(
  `(${writes.get("/tmp/gh-aw/qa/browser-guard.js")})`,
  { URL },
);
const browserConfig = JSON.parse(writes.get("/tmp/gh-aw/qa/browser.json"));
async function request(url, method = "GET", redirect) {
  let handler,
    aborted = false,
    fulfilled = false;
  const fetched = [];
  await guard({
    context: () => ({
      route: async (_, value) => {
        handler = value;
      },
      routeWebSocket: async () => {},
    }),
  });
  await handler({
    request: () => ({ url: () => url, method: () => method }),
    abort: async () => {
      aborted = true;
    },
    fulfill: async () => {
      fulfilled = true;
    },
    fetch: async (options) => {
      fetched.push(options.url);
      assert.equal(options.maxRedirects, 0);
      return {
        status: () => (redirect ? 302 : 200),
        headers: () => (redirect ? { location: redirect } : {}),
        dispose: async () => {},
      };
    },
  });
  return { fetched, aborted, fulfilled };
}

test("the agent can inspect arbitrary public routes on the captured target and baseline", async () => {
  assert.ok(
    (await request("https://snapcraft.io/a-new-public-page")).fulfilled,
  );
  assert.ok(
    (await request("http://host.docker.internal:8004/another-area")).fulfilled,
  );
  assert.ok((await request("https://assets.ubuntu.com/icon.svg")).fulfilled);
  assert.equal(browserConfig.browser.contextOptions.locale, "en-GB");
  assert.equal(browserConfig.browser.contextOptions.timezoneId, "UTC");
  assert.equal(browserConfig.browser.contextOptions.serviceWorkers, "block");
});

test("writes, sensitive routes, demos, other ports and redirect escapes are blocked before reaching them", async () => {
  for (const [url, method] of [
    ["https://snapcraft.io/publish", "POST"],
    ["https://snapcraft.io/account", "GET"],
    ["https://snapcraft.io/%61dmin", "GET"],
    ["https://evil.test/", "GET"],
    ["https://snapcraft-io-pr-43.marketplace.demos.canonical.com/", "GET"],
    ["http://host.docker.internal:8005/", "GET"],
  ]) {
    const result = await request(url, method);
    assert.ok(result.aborted);
    assert.equal(result.fetched.length, 0);
  }
  const redirected = await request(
    "https://snapcraft.io/",
    "GET",
    "https://evil.test/",
  );
  assert.ok(redirected.aborted);
  assert.equal(redirected.fetched.length, 1);
});

test("one agentic workflow drives Playwright, explores freely, uses a rock and has no scripted QA action", async () => {
  const lock = await readFile(
    new URL("../../workflows/auto-qa.lock.yml", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(lock, /^  (capture|browser):/m);
  assert.match(lock, /^  pull_request:/m);
  assert.doesNotMatch(lock, /pull_request_target/);
  assert.doesNotMatch(
    lock,
    /marketplace\.demos|find an attested demo|candidate\.runId/,
  );
  assert.doesNotMatch(lock, /steps\.context\.outputs\.build/);
  assert.match(lock, /name: Setup isolated rock builder/);
  assert.match(lock, /name: Pack and start the PR rock/);
  assert.match(lock, /shell\(playwright-cli:\*\)/);
  assert.match(workflow, /playwright:\n\s+version: "0\.1\.18"/);
  assert.match(workflow, /Explore beyond the supplied steps/);
  assert.match(workflow, /agent-selected exploratory coverage/);
  assert.match(workflow, /rockcraft pack --platform amd64/);
  assert.match(workflow, /env -i HOME=/);
  assert.match(workflow, /--cap-drop ALL/);
  assert.match(workflow, /allow-host-ports: \[8004\]/);
  assert.match(workflow, /roles: \[admin, maintainer, write\]/);
  assert.match(workflow, /github.event.sender.type == 'User'/);
  assert.doesNotMatch(
    workflow,
    /\.github\/actions\/auto-qa|stage: browser|browse\(snapshot|dotrun/,
  );
  assert.equal(scenarios.length, 8);
});
