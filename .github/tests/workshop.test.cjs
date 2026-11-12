const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const { test } = require("node:test");

const hook = resolve(
  __dirname,
  "../../.workshop/snapcraft-io/hooks/setup-project",
);

function runSetup(t, failures = {}, script = hook) {
  const directory = mkdtempSync(join(tmpdir(), "snapcraft-workshop-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const bin = join(directory, "bin");
  mkdirSync(bin);
  for (const command of ["uv", "yarn", "apt-get"]) {
    writeFileSync(
      join(bin, command),
      `#!/bin/sh\nprintf '%s\\n' "${command} $*" >> "$HOME/commands"\nexit "\${FAIL_${command.toUpperCase().replaceAll("-", "_")}:-0}"\n`,
      { mode: 0o755 },
    );
  }
  const result = spawnSync("bash", [script], {
    cwd: directory,
    env: {
      ...process.env,
      HOME: directory,
      PATH: `${bin}:${process.env.PATH}`,
      ...failures,
    },
    encoding: "utf8",
  });
  return {
    result,
    commands: readFileSync(join(directory, "commands"), "utf8")
      .trim()
      .split("\n"),
    profile: () => readFileSync(join(directory, ".profile"), "utf8"),
  };
}

test("Workshop installs the system dependencies needed by Cypress", (t) => {
  const baseHook = resolve(
    __dirname,
    "../../.workshop/snapcraft-io/hooks/setup-base",
  );
  const { result, commands } = runSetup(t, {}, baseHook);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(commands, [
    "apt-get update",
    "apt-get install -y --no-install-recommends libasound2t64 libgbm1 libgtk-3-0t64 libnotify4 libnss3 libxss1 libxtst6 xauth xvfb",
  ]);
});

test("Workshop installs locked dependencies and configures the development shell", (t) => {
  const { result, commands, profile } = runSetup(t);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(commands, [
    "uv venv --allow-existing",
    "uv pip install -r requirements.txt",
    "yarn install --immutable",
  ]);
  const shell = profile();
  assert.match(shell, /\. \/project\/\.venv\/bin\/activate/);
  assert.ok(
    shell.indexOf(". /project/.env\n") < shell.indexOf(". /project/.env.local"),
  );
  assert.match(shell, /\[ -f \/project\/\.env\.local \]/);
});

test("Workshop stops immediately if Python setup fails", (t) => {
  const { result, commands, profile } = runSetup(t, { FAIL_UV: "42" });
  assert.equal(result.status, 42);
  assert.deepEqual(commands, ["uv venv --allow-existing"]);
  assert.throws(profile, { code: "ENOENT" });
});

test("Workshop does not report successful setup if Yarn installation fails", (t) => {
  const { result, profile } = runSetup(t, { FAIL_YARN: "43" });
  assert.equal(result.status, 43);
  assert.throws(profile, { code: "ENOENT" });
});
