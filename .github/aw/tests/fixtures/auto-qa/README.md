# Autonomous QA fixtures

`page.html?mode=baseline` is the comparison page. The `intentional`, `layout`,
`broken`, `dynamic` and `injection` modes reproduce the five browser scenarios in
`scenarios.json`; links retain the mode. These are isolated replay fixtures, not
mock data injected into the real application. The remaining cases describe
missing QA (which defaults to diff-guided regression-only testing), an unavailable
local rock and PR-modified packaging recipes.

The agent must interpret natural-language QA and select its own exploratory
coverage. These fixtures deliberately do not define a command parser or a
precomputed browser report. Assess the observed report against each scenario's
`expected` criterion; an actual agent run is needed to evaluate those decisions.

Local deterministic guard checks (no model, Docker or credentials needed):

```bash
dotrun exec node --test .github/aw/tests/auto-qa.test.mjs
gh aw compile auto-qa --validate --actionlint --shellcheck
```
