// Exercise the pinned gh-aw publisher with the flattened single-file staging
// observed in https://github.com/canonical/snapcraft.io/actions/runs/43182069125.
// GitHub/network effects are replaced; file selection, limits and temporary-ID
// handling run from the exact action revision used by the compiled workflow.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
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
const config = JSON.parse(JSON.parse(`"${configString}"`)).upload_artifact;
// Actions normally resolves the retention expression before the handler runs.
config["retention-days"] = 14;

function publisherFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "auto-qa-publisher-"));
  const workspace = path.join(root, "workspace");
  const runner = path.join(root, "runner");
  const staging = path.join(runner, "gh-aw/safeoutputs/upload-artifacts");
  fs.mkdirSync(workspace);
  fs.mkdirSync(staging, { recursive: true });
  const uploads = [];
  const loaded = new Map();
  const load = (name) => {
    if (loaded.has(name)) return loaded.get(name);
    const module = { exports: {} };
    const requireFixture = (id) => {
      switch (id) {
        case "./safe_output_helpers.cjs":
          return { isStagedMode: () => false };
        case "./error_codes.cjs":
          return {
            ERR_CONFIG: "ERR_CONFIG",
            ERR_VALIDATION: "ERR_VALIDATION",
            ERR_SYSTEM: "ERR_SYSTEM",
          };
        case "./error_helpers.cjs":
          return { getErrorMessage: (error) => error.message };
        case "./artifact_client.cjs":
          return {
            DefaultArtifactClient: class {
              constructor() {
                throw new Error("Real uploads are prohibited in tests");
              }
            },
          };
        case "./work_queue_claim_scope.cjs":
          return {
            currentClaimHandle: () => null,
            readClaimScopeContext: () => null,
            assertClaimAuthorized: async (message) => message,
            recordClaimEffect: () => null,
            scopedArtifactFilename: (filename) => filename,
          };
        case "./work_queue_host.cjs":
          return {};
        default:
          if (id.startsWith("./")) {
            assert.ok(
              [
                "./glob_pattern_helpers.cjs",
                "./symlink_guard.cjs",
                "./temporary_id.cjs",
              ].includes(id),
              `Unexpected dependency: ${id}`,
            );
            return load(id.slice(2));
          }
          assert.ok(
            ["fs", "os", "path", "crypto"].includes(id),
            `Unexpected builtin: ${id}`,
          );
          return require(id);
      }
    };
    vm.runInNewContext(
      fs.readFileSync(path.join(runtime, name), "utf8"),
      {
        module,
        exports: module.exports,
        require: requireFixture,
        process: {
          env: {
            GITHUB_WORKSPACE: workspace,
            RUNNER_TEMP: runner,
            GITHUB_REPOSITORY: "canonical/snapcraft.io",
            GITHUB_RUN_ID: "1",
            GH_AW_ARTIFACT_RESOLVER_FILE: path.join(root, "resolver.json"),
          },
          cwd: () => workspace,
          platform: process.platform,
        },
        Buffer,
        URL,
        core: { info() {}, warning() {}, setOutput() {} },
        global: {
          __createArtifactClient: () => ({
            async uploadArtifact(name, files, directory, options) {
              uploads.push({
                name,
                files: Array.from(files),
                directory,
                options,
              });
              return { id: uploads.length, size: fs.statSync(files[0]).size };
            },
          }),
        },
      },
      { filename: name },
    );
    loaded.set(name, module.exports);
    return module.exports;
  };
  return {
    root,
    staging,
    uploads,
    publisher: load("upload_artifact.cjs"),
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

test("publishes all four flattened screenshot files as images with declared IDs", async () => {
  const fixture = publisherFixture();
  try {
    const handle = await fixture.publisher.main(config);
    const filenames = [
      "home-desktop-prod.png",
      "home-desktop-demo.png",
      "home-mobile-prod.png",
      "home-mobile-demo.png",
    ];
    for (const [index, filename] of filenames.entries()) {
      fs.writeFileSync(
        path.join(fixture.staging, filename),
        Buffer.from([137, 80, 78, 71]),
      );
      const declaredId = `#aw_img${index}`;
      // The MCP acknowledgement need not return the image ID: it was declared.
      const acknowledgement = {
        result: "success",
        output_id: `so_fixture_${index}`,
      };
      assert.equal(acknowledgement.temporary_id, undefined);
      const result = await handle(
        { path: filename, temporary_id: declaredId },
        {},
        new Map(),
      );
      assert.equal(result.success, true, result.error);
      assert.equal(`#${result.temporaryId}`, declaredId);
      assert.match(result.artifactUrl, /\/artifacts\/\d+$/);
      const upload = fixture.uploads[index];
      assert.deepEqual(upload.files, [path.join(fixture.staging, filename)]);
      assert.equal(upload.options.skipArchive, true);
      assert.equal(upload.options.retentionDays, 14);
    }
    assert.equal(fixture.uploads.length, 4);
    const resolver = JSON.parse(
      fs.readFileSync(path.join(fixture.root, "resolver.json"), "utf8"),
    );
    assert.deepEqual(Object.keys(resolver), [
      "aw_img0",
      "aw_img1",
      "aw_img2",
      "aw_img3",
    ]);
  } finally {
    fixture.cleanup();
  }
});

test("reproduces the hosted failure with the old source-directory allowlist", async () => {
  const fixture = publisherFixture();
  try {
    fs.writeFileSync(
      path.join(fixture.staging, "home-desktop-prod.png"),
      "screenshot",
    );
    const handle = await fixture.publisher.main({
      ...config,
      "allowed-paths": ["auto-qa-evidence/*.png"],
    });
    const result = await handle(
      {
        path: "home-desktop-prod.png",
        temporary_id: "#aw_prod1",
      },
      {},
      new Map(),
    );
    assert.equal(result.success, false);
    assert.match(result.error, /no files matched/);
    assert.equal(fixture.uploads.length, 0);
  } finally {
    fixture.cleanup();
  }
});

test("rejects context, arbitrary PNGs, ZIPs, traversal and missing screenshots", async () => {
  const fixture = publisherFixture();
  try {
    const handle = await fixture.publisher.main(config);
    for (const filename of [
      "context.json",
      "cookies.png",
      "home-desktop-demo.zip",
    ]) {
      fs.writeFileSync(
        path.join(fixture.staging, filename),
        "not screenshot evidence",
      );
      const result = await handle(
        { path: filename, temporary_id: "#aw_bad1" },
        {},
        new Map(),
      );
      assert.equal(result.success, false);
      assert.match(result.error, /no files matched/);
    }
    const traversal = await handle(
      { path: "../home-desktop-demo.png" },
      {},
      new Map(),
    );
    assert.equal(traversal.success, false);
    assert.match(traversal.error, /must not traverse/);
    const missing = await handle(
      { path: "missing-desktop-demo.png" },
      {},
      new Map(),
    );
    assert.equal(missing.success, false);
    assert.match(missing.error, /does not exist/);
    assert.equal(fixture.uploads.length, 0);
  } finally {
    fixture.cleanup();
  }
});
