import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const schemaDir = dirname(fileURLToPath(import.meta.url));
const openspecDir = dirname(dirname(schemaDir));
const changeName = "compiler-smoke-test";
const artifactIds = ["human-spec", "testing-plan", "specs", "tasks"];

// Synthetic approved inputs exercise CLI wiring, not an LLM's translation.
const humanSpec = `# Reviewed specification

## Greeting
The system must greet the user with "Hello" when they request a greeting.

## Farewell
The system must say "Goodbye" when the user requests a farewell.

## QA
An engineer confirms the greeting and farewell meet these requirements.
`;
const testingPlan = `# Reviewed testing plan

- [ ] TP1: requesting a greeting returns "Hello"; unit test.
- [ ] TP2: requesting a farewell returns "Goodbye"; unit test.
- [ ] TP3: engineer confirms both outcomes during QA.
`;

function hash(content) {
  return createHash("sha256").update(content).digest("hex");
}

const revisions = `Source revisions (SHA-256):
- human-spec.md: ${hash(humanSpec)}
- testing-plan.md: ${hash(testingPlan)}
`;

function delta(capability, output, testId) {
  return `# ${capability} delta

<!-- ${revisions} -->

## Purpose

Let users request a ${capability} and receive the approved response from the system.

## ADDED Requirements

### Requirement: Requested ${capability}
The system SHALL return "${output}" when the user requests a ${capability}.

Source: human-spec.md, ${capability}.

#### Scenario: User requests a ${capability}
- **WHEN** the user requests a ${capability}
- **THEN** the system returns "${output}"

Source: testing-plan.md, ${testId}.
`;
}

const checklist = `# Implementation plan

${revisions}

## Delta inventory

- specs/greeting/spec.md
- specs/farewell/spec.md

## 1. Greeting

- [ ] 1.1 RED: write TP1; verify: the greeting test fails because Hello is missing.
- [ ] 1.2 GREEN: implement Greeting; verify: TP1 passes.
- [ ] 1.3 REFACTOR/VERIFY: review Greeting; verify: TP1 still passes.

## 2. Farewell

- [ ] 2.1 RED: write TP2; verify: the farewell test fails because Goodbye is missing.
- [ ] 2.2 GREEN: implement Farewell; verify: TP2 passes.
- [ ] 2.3 REFACTOR/VERIFY: review Farewell; verify: TP1 and TP2 pass.

## 3. Human QA

- [ ] 3.1 HUMAN QA: verify Greeting and Farewell; verify: engineer confirms TP3.
`;

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "openspec-human-authored-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const localOpenspec = join(root, "openspec");
  mkdirSync(join(localOpenspec, "changes"), { recursive: true });
  mkdirSync(join(localOpenspec, "specs"));
  cpSync(schemaDir, join(localOpenspec, "schemas", "human-authored"), {
    recursive: true,
  });
  cpSync(join(openspecDir, "config.yaml"), join(localOpenspec, "config.yaml"));

  function cli(...args) {
    const result = spawnSync(process.env.OPENSPEC_BIN || "openspec", args, {
      cwd: root,
      encoding: "utf8",
      timeout: 10000,
      env: {
        ...process.env,
        CI: "1",
        DO_NOT_TRACK: "1",
        OPENSPEC_TELEMETRY: "0",
        XDG_CONFIG_HOME: join(root, "config"),
      },
    });
    assert.ifError(result.error);
    assert.equal(
      result.status,
      0,
      `openspec ${args.join(" ")}\n${result.stdout}\n${result.stderr}`,
    );
    return JSON.parse(result.stdout);
  }

  cli("new", "change", changeName, "--json");
  const changeDir = join(localOpenspec, "changes", changeName);
  function write(relativePath, content) {
    const target = join(changeDir, relativePath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  function populate() {
    write("human-spec.md", humanSpec);
    write("testing-plan.md", testingPlan);
    write("specs/greeting/spec.md", delta("greeting", "Hello", "TP1"));
    write("specs/farewell/spec.md", delta("farewell", "Goodbye", "TP2"));
    write("implementation-plan.md", checklist);
  }
  return {
    cli,
    write,
    populate,
    changeDir,
    apply: () => cli("instructions", "apply", "--change", changeName, "--json"),
    status: () => cli("status", "--change", changeName, "--json"),
  };
}

test("the default schema resolves all templates and waits for both human inputs", (t) => {
  const f = fixture(t);
  assert.equal(
    f.cli("schema", "validate", "human-authored", "--json").valid,
    true,
  );
  assert.equal(f.status().schemaName, "human-authored");
  assert.deepEqual(
    Object.fromEntries(
      f.status().artifacts.map(({ id, status }) => [id, status]),
    ),
    {
      "human-spec": "ready",
      "testing-plan": "ready",
      specs: "blocked",
      tasks: "blocked",
    },
  );
  for (const id of artifactIds) {
    const instructions = f.cli(
      "instructions",
      id,
      "--change",
      changeName,
      "--json",
    );
    assert.ok(instructions.template.trim(), `${id} has a resolved template`);
    if (id === "human-spec" || id === "testing-plan") {
      assert.match(instructions.instruction, /HUMAN-OWNED INPUT/);
    }
  }
  f.write("human-spec.md", humanSpec);
  assert.equal(
    f.status().artifacts.find(({ id }) => id === "specs").status,
    "blocked",
  );
  f.write("testing-plan.md", testingPlan);
  assert.equal(
    f.status().artifacts.find(({ id }) => id === "specs").status,
    "ready",
  );
});

test("apply blocks when any required input or compiled artifact is missing", (t) => {
  const f = fixture(t);
  f.populate();
  assert.equal(f.apply().state, "ready");
  const paths = {
    "human-spec": "human-spec.md",
    "testing-plan": "testing-plan.md",
    specs: "specs",
    tasks: "implementation-plan.md",
  };
  for (const [id, path] of Object.entries(paths)) {
    rmSync(join(f.changeDir, path), { recursive: true });
    const blocked = f.apply();
    assert.equal(blocked.state, "blocked", `missing ${id} blocks apply`);
    assert.ok(blocked.missingArtifacts.includes(id));
    f.populate();
  }
  f.write("implementation-plan.md", "# Plan without any checkboxes\n");
  assert.equal(f.apply().state, "blocked");
});

test("multiple capability deltas validate without proposal or design artifacts", (t) => {
  const f = fixture(t);
  f.populate();
  const status = f.status();
  assert.deepEqual(
    status.artifacts.map(({ id }) => id).sort(),
    artifactIds.toSorted(),
  );
  assert.equal(status.artifactPaths.specs.existingOutputPaths.length, 2);
  assert.ok(status.artifacts.every(({ status }) => status === "done"));
  // The CLI's exit status is the public validation contract.
  f.cli("validate", changeName, "--strict", "--json");
});

test("apply tracks only the implementation checklist and refreshes checkbox locations", (t) => {
  const f = fixture(t);
  f.populate();
  const initial = f.apply();
  assert.deepEqual(initial.progress, { total: 7, complete: 0, remaining: 7 });
  assert.deepEqual(
    Object.keys(initial.contextFiles).sort(),
    artifactIds.toSorted(),
  );
  assert.equal(initial.contextFiles.specs.length, 2);
  assert.ok(
    initial.tasks.every(({ sourcePath }) =>
      sourcePath.endsWith("implementation-plan.md"),
    ),
  );

  const first = initial.tasks[0];
  const lines = readFileSync(first.sourcePath, "utf8").split("\n");
  assert.match(lines[first.line - 1], /1\.1 RED:/);
  lines[first.line - 1] = lines[first.line - 1].replace("- [ ]", "- [x]");
  writeFileSync(first.sourcePath, lines.join("\n"));
  assert.deepEqual(f.apply().progress, { total: 7, complete: 1, remaining: 6 });

  const automatedComplete = checklist
    .replaceAll("- [ ]", "- [x]")
    .replace("- [x] 3.1 HUMAN QA:", "- [ ] 3.1 HUMAN QA:");
  f.write("implementation-plan.md", automatedComplete);
  assert.deepEqual(f.apply().progress, { total: 7, complete: 6, remaining: 1 });
  assert.equal(f.apply().state, "ready");

  f.write(
    "implementation-plan.md",
    automatedComplete.replace("- [ ]", "- [x]"),
  );
  assert.equal(f.apply().state, "all_done");
  assert.equal(
    readFileSync(join(f.changeDir, "human-spec.md"), "utf8"),
    humanSpec,
  );
  assert.equal(
    readFileSync(join(f.changeDir, "testing-plan.md"), "utf8"),
    testingPlan,
  );
});
