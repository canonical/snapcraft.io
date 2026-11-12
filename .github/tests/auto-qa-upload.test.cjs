// Exercise the exact pinned upload_asset staging handler and branch publisher.
// Only the surrounding output ledger, Git commands and Actions reporting are
// faked. Path guards, hashing, extension/size checks and asset writes are real.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const vm = require("node:vm");
const { test } = require("node:test");

const runtime = process.env.GH_AW_TEST_ACTIONS_DIR;
assert.ok(
  runtime,
  "Set GH_AW_TEST_ACTIONS_DIR to the pinned action's setup/js directory",
);
const lock = fs.readFileSync(
  path.join(__dirname, "../workflows/auto-qa.lock.yml"),
  "utf8",
);
const configString = lock.match(/GH_AW_SAFE_OUTPUTS_HANDLER_CONFIG: "(.*)"/)[1];
const config = JSON.parse(JSON.parse(`"${configString}"`)).upload_asset;
const workflow = fs.readFileSync(
  path.join(__dirname, "../workflows/auto-qa.md"),
  "utf8",
);
const validationScript = workflow
  .split("      - name: Validate every screenshot before publication\n")[1]
  .split("          script: |\n")[1]
  .split("\n  safe_outputs:\n")[0];
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const validateScreenshots = new AsyncFunction(
  "require",
  "process",
  validationScript.replace(/^            /gm, ""),
);
const publicScript = workflow
  .split(
    "      - name: Verify published screenshots are publicly embeddable\n",
  )[1]
  .split("          script: |\n")[1]
  .split("\n  qa_preflight:\n")[0];
const verifyPublicScreenshots = new AsyncFunction(
  "require",
  "process",
  "context",
  "fetch",
  publicScript.replace(/^            /gm, ""),
);

function publisherFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "auto-qa-assets-"));
  const workspace = path.join(root, "workspace");
  const checkout = path.join(root, "checkout");
  const runner = path.join(root, "runner");
  const staging = path.join(runner, "gh-aw/safeoutputs/assets");
  for (const directory of [workspace, checkout, staging])
    fs.mkdirSync(directory, { recursive: true });
  const items = [];
  const commands = [];
  const failures = [];
  const outputs = {};
  const env = {
    GITHUB_WORKSPACE: workspace,
    RUNNER_TEMP: runner,
    GITHUB_REPOSITORY: "canonical/snapcraft.io",
    GITHUB_SERVER_URL: "https://github.com",
    GH_AW_ASSETS_DIR: staging,
    GH_AW_ASSETS_BRANCH: config.branch,
    GH_AW_ASSETS_MAX_SIZE_KB: String(config["max-size"]),
    GH_AW_ASSETS_ALLOWED_EXTS: config["allowed-exts"].join(","),
  };
  // Keep the publisher's relative file operations inside its disposable checkout.
  const scopedPath = {
    ...path,
    resolve: (...parts) => path.resolve(checkout, ...parts),
  };
  const scopedFs = {
    ...fs,
    existsSync: (filename) => fs.existsSync(path.resolve(checkout, filename)),
  };
  const core = {
    info() {},
    warning() {},
    setFailed: (error) => failures.push(error),
    setOutput: (name, value) => {
      outputs[name] = value;
    },
    summary: {
      addRaw() {
        return this;
      },
      async write() {},
    },
  };
  const loaded = new Map();
  const load = (name) => {
    if (loaded.has(name)) return loaded.get(name);
    const module = { exports: {} };
    const requireFixture = (id) => {
      if (id === "./load_agent_output.cjs")
        return { loadAgentOutput: () => ({ success: true, items }) };
      if (id === "./error_codes.cjs")
        return Object.fromEntries(
          ["ERR_CONFIG", "ERR_VALIDATION", "ERR_SYSTEM", "ERR_API"].map(
            (code) => [code, code],
          ),
        );
      if (id === "./error_helpers.cjs")
        return { getErrorMessage: (error) => error.message };
      if (id.startsWith("./")) {
        assert.ok(
          [
            "./symlink_guard.cjs",
            "./normalize_branch_name.cjs",
            "./allowed_extensions_helpers.cjs",
          ].includes(id),
          `Unexpected dependency: ${id}`,
        );
        return load(id.slice(2));
      }
      if (id === "fs") return scopedFs;
      if (id === "path") return scopedPath;
      assert.ok(["os", "crypto"].includes(id), `Unexpected builtin: ${id}`);
      return require(id);
    };
    vm.runInNewContext(
      fs.readFileSync(path.join(runtime, name), "utf8"),
      {
        module,
        exports: module.exports,
        require: requireFixture,
        process: { env, cwd: () => checkout, platform: process.platform },
        Buffer,
        URL,
        core,
        exec: {
          async exec(command, args) {
            commands.push([command, ...args]);
            return 0;
          },
          async getExecOutput(command, args) {
            commands.push([command, ...args]);
            return { exitCode: 0, stdout: "", stderr: "" };
          },
        },
      },
      { filename: name },
    );
    loaded.set(name, module.exports);
    return module.exports;
  };
  // Extract the unmodified handler body rather than load unrelated PR/git tools.
  const handlerSource = fs.readFileSync(
    path.join(runtime, "safe_outputs_handlers.cjs"),
    "utf8",
  );
  const handler = handlerSource.match(
    /  const uploadAssetHandler = args => \{([\s\S]*?)\n  \};/,
  );
  assert.ok(
    handler,
    "The pinned runtime must expose the expected asset handler",
  );
  const stage = vm.runInNewContext(`args => {${handler[1]}\n}`, {
    process: { env },
    path: scopedPath,
    crypto,
    URL,
    ...load("symlink_guard.cjs"),
    ...load("normalize_branch_name.cjs"),
    ...load("allowed_extensions_helpers.cjs"),
    uploadedAssetPaths: new Set(),
    scopedKey: (value) => value,
    currentClaimHandle: () => null,
    appendSafeOutputCounted: (item) =>
      items.push({ ...item, output_id: `so_asset_${items.length}` }),
    getErrorMessage: (error) => error.message,
    ERR_CONFIG: "ERR_CONFIG",
    ERR_VALIDATION: "ERR_VALIDATION",
    ERR_SYSTEM: "ERR_SYSTEM",
  });
  // Match the hosted collector: declarations omit runtime-generated metadata.
  function writeDeclarations(filename) {
    fs.writeFileSync(
      filename,
      JSON.stringify({
        items: items.map(({ type, path, output_id }) => ({
          type,
          path,
          output_id,
        })),
      }),
    );
    if (items.length)
      fs.writeFileSync(
        path.join(path.dirname(filename), "safeoutputs.jsonl"),
        items.map((item) => JSON.stringify(item)).join("\n") + "\n",
      );
  }
  return {
    root,
    workspace,
    checkout,
    staging,
    items,
    commands,
    failures,
    outputs,
    stage,
    async validate() {
      const validationRoot = path.dirname(staging);
      fs.mkdirSync(path.join(validationRoot, "declarations"), {
        recursive: true,
      });
      writeDeclarations(
        path.join(validationRoot, "declarations", "agent_output.json"),
      );
      await validateScreenshots(
        (id) => {
          assert.ok(["node:fs", "node:path", "node:crypto"].includes(id));
          return require(id);
        },
        {
          env: {
            QA_CONTEXT: JSON.stringify({
              status: "ready",
              repository: "canonical/snapcraft.io",
              evidence_directory: workspace,
            }),
            QA_ASSET_VALIDATION_ROOT: validationRoot,
          },
        },
      );
    },
    async verify(fetchImage) {
      assert.equal(
        typeof fetchImage,
        "function",
        "Network access must be mocked",
      );
      const declarations = path.join(root, "public-declarations.json");
      writeDeclarations(declarations);
      await verifyPublicScreenshots(
        (id) => {
          if (id === "node:timers/promises")
            return { setTimeout: async () => {} };
          assert.ok(["node:fs", "node:path", "node:crypto"].includes(id));
          return require(id);
        },
        { env: { QA_DECLARATIONS: declarations } },
        { repo: { owner: "canonical", repo: "snapcraft.io" } },
        fetchImage,
      );
    },
    publish: load("upload_assets.cjs").main,
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=",
  "base64",
);

test("stages and publishes four PNGs with matching raw URLs on the one shared branch", async () => {
  const fixture = publisherFixture();
  try {
    for (const [index, filename] of [
      "home-desktop-prod.png",
      "home-desktop-demo.png",
      "home-mobile-prod.png",
      "home-mobile-demo.png",
    ].entries()) {
      const source = path.join(fixture.workspace, filename);
      const content = Buffer.concat([png, Buffer.from(String(index))]);
      fs.writeFileSync(source, content);
      const response = fixture.stage({ path: source });
      const url = JSON.parse(response.content[0].text).result;
      const hash = crypto.createHash("sha256").update(content).digest("hex");
      assert.equal(
        url,
        `https://github.com/canonical/snapcraft.io/blob/assets/auto-qa/${hash}.png?raw=true`,
      );
      assert.equal(fixture.items[index].url, url);
      // A caller cannot select a different output filename or URL in path mode.
      fixture.items[index].targetFileName = "../../outside.png";
    }
    await fixture.validate();
    await fixture.publish();
    assert.deepEqual(fixture.failures, []);
    assert.equal(fixture.outputs.branch_name, "assets/auto-qa");
    assert.equal(fixture.outputs.upload_count, "4");
    assert.equal(fs.readdirSync(fixture.checkout).length, 4);
    assert.deepEqual(
      fixture.commands.filter((command) => command[1] === "push"),
      [["git", "push", "--porcelain", "origin", "assets/auto-qa"]],
    );
  } finally {
    fixture.cleanup();
  }
});

test("deduplicates identical image bytes without overwriting existing assets", async () => {
  const fixture = publisherFixture();
  try {
    const urls = [];
    for (const filename of [
      "first-desktop-demo.png",
      "second-desktop-demo.png",
    ]) {
      const source = path.join(fixture.workspace, filename);
      fs.writeFileSync(source, png);
      urls.push(
        JSON.parse(fixture.stage({ path: source }).content[0].text).result,
      );
    }
    assert.equal(urls[0], urls[1]);
    await fixture.validate();
    await fixture.publish();
    assert.deepEqual(fixture.failures, []);
    assert.equal(fixture.outputs.upload_count, "1");
    assert.equal(fs.readdirSync(fixture.checkout).length, 1);
  } finally {
    fixture.cleanup();
  }
});

test("rejects non-PNGs, oversize files, symlinks and duplicate source submissions", () => {
  const fixture = publisherFixture();
  try {
    for (const filename of ["context.json", "profile.zip", "photo.jpg"]) {
      const source = path.join(fixture.workspace, filename);
      fs.writeFileSync(source, "not screenshot evidence");
      assert.throws(
        () => fixture.stage({ path: source }),
        /extension.*not allowed/,
      );
    }
    const large = path.join(fixture.workspace, "large.png");
    fs.writeFileSync(large, Buffer.alloc(config["max-size"] * 1024 + 1));
    assert.throws(() => fixture.stage({ path: large }), /[Ss]ize|large|limit/);
    const source = path.join(fixture.workspace, "good.png");
    const link = path.join(fixture.workspace, "link.png");
    fs.writeFileSync(source, png);
    fs.symlinkSync(source, link);
    assert.throws(
      () => fixture.stage({ path: link }),
      /symlink|isolated regular/,
    );
    fixture.stage({ path: source });
    assert.throws(
      () => fixture.stage({ path: source }),
      /Duplicate upload_asset source/,
    );
  } finally {
    fixture.cleanup();
  }
});

test("validation rejects a partial asset loss before anything is published", async () => {
  const fixture = publisherFixture();
  try {
    for (const filename of ["home-desktop-prod.png", "home-desktop-demo.png"]) {
      const source = path.join(fixture.workspace, filename);
      fs.writeFileSync(source, png);
      fixture.stage({ path: source });
    }
    fs.unlinkSync(
      path.join(fixture.staging, fs.readdirSync(fixture.staging)[0]),
    );
    await assert.rejects(fixture.validate(), /ENOENT/);
    assert.equal(fixture.commands.length, 0);
  } finally {
    fixture.cleanup();
  }
});

test("validation preserves screenshot filename restrictions and checks PNG bytes and URLs", async () => {
  for (const [filename, content, override, error] of [
    ["cookies.png", png, {}, /Only named screenshots/],
    [
      "home-desktop-demo.png",
      Buffer.from("not PNG bytes"),
      {},
      /PNG signature/,
    ],
    [
      "home-desktop-demo.png",
      png,
      { url: "https://evil.example/ignored.png" },
      /Screenshot URL/,
    ],
    [
      "home-desktop-demo.png",
      png,
      { sha: "0".repeat(64) },
      /content or PNG signature/,
    ],
    [
      "home-desktop-demo.png",
      png,
      { output_id: undefined },
      /exactly one ledger entry/,
    ],
  ]) {
    const fixture = publisherFixture();
    try {
      const source = path.join(fixture.workspace, filename);
      fs.writeFileSync(source, content);
      fixture.stage({ path: source });
      Object.assign(fixture.items[0], override);
      await assert.rejects(fixture.validate(), error);
      assert.equal(fixture.commands.length, 0);
    } finally {
      fixture.cleanup();
    }
  }
});

test("validation and public checks reject blank ledger output IDs", async () => {
  for (const output_id of ["", " \t\n"]) {
    const fixture = publisherFixture();
    try {
      const source = path.join(fixture.workspace, "home-desktop-demo.png");
      fs.writeFileSync(source, png);
      fixture.stage({ path: source });
      fixture.items[0].output_id = output_id;
      await assert.rejects(fixture.validate(), /exactly one ledger entry/);
      await assert.rejects(
        fixture.verify(async () => assert.fail("Must not fetch a blank-ID asset")),
        /exactly one ledger entry/,
      );
      assert.equal(fixture.commands.length, 0);
    } finally {
      fixture.cleanup();
    }
  }
});

test("validation and public checks reject ambiguous ledger output IDs", async () => {
  const fixture = publisherFixture();
  try {
    const source = path.join(fixture.workspace, "home-desktop-demo.png");
    fs.writeFileSync(source, png);
    fixture.stage({ path: source });
    fixture.items.push({ ...fixture.items[0] });
    await assert.rejects(fixture.validate(), /exactly one ledger entry/);
    await assert.rejects(
      fixture.verify(async () => assert.fail("Must not fetch an ambiguous asset")),
      /exactly one ledger entry/,
    );
    assert.equal(fixture.commands.length, 0);
  } finally {
    fixture.cleanup();
  }
});

test("public verification requires anonymously readable matching PNG bytes before comments", async () => {
  const fixture = publisherFixture();
  try {
    const source = path.join(fixture.workspace, "home-desktop-prod.png");
    fs.writeFileSync(source, png);
    fixture.stage({ path: source });
    let requests = 0;
    await fixture.verify(async (url, options) => {
      requests++;
      assert.equal(url, fixture.items[0].url);
      assert.equal(options.credentials, "omit");
      assert.equal(options.headers, undefined);
      return new Response(png, { headers: { "content-type": "image/png" } });
    });
    assert.equal(requests, 1);
    for (const response of [
      () => new Response("missing", { status: 404 }),
      () =>
        new Response("HTML page", { headers: { "content-type": "text/html" } }),
      () =>
        new Response("wrong PNG", { headers: { "content-type": "image/png" } }),
    ]) {
      requests = 0;
      await assert.rejects(
        fixture.verify(async () => {
          requests++;
          return response();
        }),
        /publication was not verified/,
      );
      assert.equal(requests, 3);
    }
  } finally {
    fixture.cleanup();
  }
});

test("reports without screenshots need no ledger or public fetch", async () => {
  const fixture = publisherFixture();
  try {
    await fixture.verify(async () => assert.fail("Must not fetch any images"));
  } finally {
    fixture.cleanup();
  }
});

test("fails publication if staged bytes were tampered with", async () => {
  const fixture = publisherFixture();
  try {
    const source = path.join(fixture.workspace, "home.png");
    fs.writeFileSync(source, png);
    fixture.stage({ path: source });
    fs.writeFileSync(
      path.join(fixture.staging, fs.readdirSync(fixture.staging)[0]),
      "tampered PNG",
    );
    await fixture.publish();
    assert.ok(
      fixture.failures.some((failure) => failure.includes("SHA mismatch")),
    );
    assert.equal(
      fixture.commands.filter((command) => command[1] === "push").length,
      0,
    );
  } finally {
    fixture.cleanup();
  }
});
