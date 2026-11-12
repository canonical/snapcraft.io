# Human-authored OpenSpec workflow

This local setup implements the division of responsibilities in
[Agentic workflow for scalable solution design and implementation](../Agentic%20workflow%20for%20scalable%20solution%20design%20and%20implementation.md).
Engineers decide the scope, solution, acceptance criteria, and testing strategy.
The agent compiles those decisions into deltas and an executable plan, then
implements that plan. No OpenSpec stores or private-repository setup is used.

## Schema and files

The project default is `human-authored`, defined in
[`schemas/human-authored/schema.yaml`](schemas/human-authored/schema.yaml).
It replaces the default proposal/design workflow:

```text
human-spec.md -------+
                     +--> specs/<capability>/spec.md --+
testing-plan.md -----+                                 +--> implementation-plan.md
         both human inputs ---------------------------+
```

Each change has this layout:

```text
openspec/changes/<change-name>/
  .openspec.yaml                 # CLI metadata
  human-spec.md                  # Human-owned input, copied unchanged
  testing-plan.md                # Human-owned input, copied unchanged
  specs/
    <capability-path>/spec.md    # Generated native delta; one per capability
  implementation-plan.md        # Generated TDD checklist; updated during apply
```

There is no generated `proposal.md` or `design.md`. Behavior contracts go into
native deltas. Already-agreed internal design constraints go into the plan,
with source references; they are not discarded or reinvented.

The two input documents may use any Markdown structure. Existing headings, IDs,
or precise passages supply traceability; there is no required human template.
The input templates in the schema are notices to the agent, **not** drafts to
fill in. If an input is absent, incomplete, or contradictory, the agent must ask
for it rather than author a substitute.

## Use with an agent

Supply the two reviewed documents and ask, for example:

> Create an OpenSpec change named `my-change` using the `human-authored` schema.
> The reviewed human spec is at `<spec-path.md>` and the reviewed testing plan
> is at `<testing-plan-path.md>`. Copy these inputs unchanged and compile the
> capability deltas and TDD checklist. Do not implement yet.

The existing `/openspec-propose` skill reads the custom schema's instructions.
Despite the command's name, it must not produce an extra proposal or make new
design decisions. The compiler may inspect code to find existing paths,
integration points, commands, and prerequisites. It may translate and order
approved work; it may not choose new architecture, dependencies, scope, test
methodologies, thresholds, or tradeoffs. If translation needs a new decision,
engineers amend the input documents before compilation resumes.

Review the generated deltas and `implementation-plan.md`, then explicitly start:

```text
/openspec-apply-change my-change
```

Apply follows each slice's RED → GREEN → REFACTOR/VERIFY sequence. Each task has
source references and a completion check. The agent records observed evidence
in the plan and updates that task's checkbox only after verification. Existing
behavior is verified without manufacturing a failing test. Non-unit and manual
gates retain the methodology specified by the engineer.

Engineer QA is part of the overarching workflow. Its criteria come from the
human inputs; the agent does not invent additional acceptance criteria. The
HUMAN QA task remains unchecked until the engineer explicitly confirms it.
Passing automated checks does not grant deployment or archive authorization.

## CLI inspection and manual input staging

These commands assume `openspec` is on `PATH`. This setup was tested with
OpenSpec **1.16.1**. The filenames and change name below are examples; substitute
your actual approved input paths and name.

```sh
openspec schema validate human-authored
openspec new change my-change
cp reviewed-spec.md openspec/changes/my-change/human-spec.md
cp reviewed-testing-plan.md openspec/changes/my-change/testing-plan.md
openspec status --change my-change
openspec instructions specs --change my-change --json
openspec instructions tasks --change my-change --json
```

`instructions` returns the agent's instructions and templates; it does not
compile Markdown by itself. After staging inputs, ask the agent to compile the
**existing** change, preserving the inputs and generating only deltas and the
implementation plan. After compilation:

```sh
openspec validate my-change --strict
openspec instructions apply --change my-change --json
openspec list --json
```

`apply.requires` explicitly lists both inputs, the deltas, and the plan.
`apply.tracks` points to `implementation-plan.md`, so progress comes from its
checkboxes, not from `tasks.md`, input checkboxes, or an external task list.
The existing apply skill re-runs the instructions after each completed task.
`status` reports artifact availability; `instructions apply` reports task
progress. Neither command runs tests or monitors implementation in the background.

## Revisions and limitations

- Both generated outputs record the SHA-256 of both human inputs. The agent
  checks those hashes before planning/applying and on resumption. A changed input
  requires reconciliation and explicit recompilation, not a silent overwrite.
- Completed tasks are not automatically valid after recompilation. Recheck
  affected evidence before retaining a completion mark.
- A missing outcome, conflicting gate, or undecided design choice is a compiler
  error. The agent must cite it and pause, not add an assumption or weaken a gate.
- OpenSpec schemas have ordinary artifact nodes, not a native read-only input
  type. Human ownership, source fidelity, hash checks, coverage completeness,
  TDD ordering, and human confirmation are **agent instructions**, not mechanical
  enforcement. The CLI primarily checks file presence, delta structure, and
  checkbox state. A placeholder file, stale output, partial set of deltas, or
  manually ticked checkbox can fool those checks; review remains necessary.
- The agent must compare the complete expected delta inventory with the actual
  files. One matching delta is sufficient for the CLI's glob-based presence check
  but is not sufficient for this workflow's coverage check.
- This schema normally expects behavioral deltas. For a truly spec-free change,
  stop and agree that workflow explicitly rather than inventing a requirement.
  OpenSpec's `skip_specs: true` metadata is available for that explicit opt-out;
  it must not be used to bypass an unresolved translation.
- Archive/sync remain native capability-delta operations. They are separate from
  compilation and task execution; neither is run automatically by this setup.

## Check the setup

No Flask build or application tests are required for these schema-only checks.
With Node.js 22+ and OpenSpec on `PATH`:

```sh
openspec schema validate human-authored --json
node --test openspec/schemas/human-authored/schema.test.mjs
```

If the CLI is installed outside `PATH`, set `OPENSPEC_BIN` to its absolute
executable path for the test command. The tests copy this configuration and
schema into temporary directories, create synthetic changes with the real CLI,
and clean them up. They verify:

- The configured default and all templates resolve.
- Both human inputs precede delta generation.
- Apply blocks if any required artifact is missing or the checklist is empty.
- Multiple capability deltas validate without proposal/design artifacts.
- Progress uses only the implementation checklist, including pending human QA.

These are CLI integration tests, not evidence that an LLM translates arbitrary
human documents faithfully. Review real generated outputs against their inputs
when evaluating the compiler behavior.
