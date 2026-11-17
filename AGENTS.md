# AGENTS.md

This file provides guidance to agents when working with code in this repository.

snapcraft.io is the web frontend for the Snap Store: a stateless Flask (Python 3.10+) app serving Jinja2 templates, with React 19 / TypeScript islands bundled by Vite 7 and styled with Vanilla Framework (SCSS).

> A detailed `.github/copilot-instructions.md` exists with build/CI specifics, PR/QA conventions, and review guidelines. Consult it for those; this file focuses on architecture and the commands you'll use most.

## Running commands

Use **Workshop** for the managed development environment. Launch once with `workshop launch`, then use named actions or the Yarn action to run scripts. Use `workshop start` for a stopped workshop and `workshop refresh` after dependency changes.

```bash
workshop run -- start                       # Flask on 8004, Vite on 5004
workshop run -- build                       # REQUIRED before Python tests
workshop run -- test                        # Build + full unit/lint suite

# Tests
workshop run -- yarn test-js
workshop run -- yarn test-js path/to/file.test.tsx
workshop run -- yarn test-python
workshop run -- yarn test-e2e                # Start workshop run -- prod first

# Lint
workshop run -- yarn lint-python
workshop run -- yarn lint-js
workshop run -- yarn lint-scss
```

CI runs Yarn/Python directly with Python 3.12 and Node.js 24. For native setup (virtual environment, dependencies, and environment variables), see HACKING.md.

## Architecture

**Flask backend (`webapp/`).** `app.py` exposes `create_app()` (built on `canonicalwebteam.flask_base`), which registers one blueprint per feature area. Code is organized by domain:

- `webapp/store/`, `webapp/snapcraft/`, `webapp/packages/` — public-facing store, marketing, and package-listing pages.
- `webapp/publisher/` — the publisher dashboard (snaps, github builds, cve, content). `webapp/admin/` — brand-store admin.
- `webapp/endpoints/` — JSON API blueprints consumed by the React frontend (builds, members, models, releases, snaps, validation_sets, etc.). These back the dashboard SPAs.
- `webapp/api/` — outbound HTTP clients to upstream services. `requests.py` defines `BaseSession` (timeouts → `ApiTimeoutError`/`ApiConnectionError`, in `api/exceptions.py`); `sso.py`, `github.py`, `marketo.py` are service-specific clients.
- `webapp/config.py` reads env (loaded first in `app.py`); `extensions.py` wires CSRF + the Vite integration; `handlers.py` sets request/error handlers; `decorators.py`, `helpers.py`, `template_utils.py`, `markdown.py` are shared utilities. `licenses.json` is the SPDX license list (see HACKING.md before editing).

**Frontend (`static/js/`).** Two single-page React apps mount into Jinja templates:

- `static/js/publisher/` and `static/js/store/` each have `index.tsx` (React Router v7 routes, lazy-loaded `pages/`), `components/`, `layouts/`, `hooks/`, and `state/`. Pages call the `webapp/endpoints/` JSON APIs.
- State management is mixed by era: newer code uses **Jotai** atoms (`publisher/state/*State.ts`) and react-query; some areas still use Redux. Match the surrounding module rather than introducing a new pattern.
- `static/js/public/` holds vanilla TS enhancements for server-rendered marketing pages (no React).

**Templates → JS wiring (Vite).** Jinja templates in `templates/` reference bundles via the `vite_import("...")` function (from `canonicalwebteam.flask-vite`). `vitePluginDetectInput.js` scans `templates/**/*.html` for these calls and auto-registers them as Vite entry points — so adding a new JS island means adding a `vite_import()` to a template, not editing `vite.config.js`. Configured via `VITE_*` env vars. Dev server runs on `VITE_PORT` (5004 locally).

**Tests** mirror the backend layout under `tests/` (Python unittest). Frontend tests live in `__tests__/` / `.test.tsx` files colocated in `static/js/`, run by Vitest with Testing Library + MSW for API mocking.

## Python requirements

- `requirements.txt` contains runtime dependencies and is used by production
  Rockcraft builds.
- `requirements-dev.txt` includes runtime requirements plus Python test/lint
  tools. Workshop and native CI checks install this set automatically. For
  native development, install it in the virtual environment before testing.

## Conventions

- **Use existing Vanilla Framework / `@canonical/react-components` / `@canonical/store-components` components** before building custom UI; keep to Vanilla's design tokens and spacing.
- Black enforces **79-char** lines on Python; rebuild assets (`workshop run -- build`) after any frontend or template change before testing the Flask app.
- Never edit or commit `static/js/dist/` (generated).

## Local dev requiring credentials

Staging APIs, GitHub/Launchpad automated builds, Sentry, and CVE data fetching all need values in `.env.local` — see HACKING.md for the exact variables and setup scripts.

## External packages and libraries

The frontend uses a CSS framework called Vanilla to build components. Examples of these components can be found at https://vanillaframework.io/docs/examples

The managed development environment is provided by [Workshop](https://ubuntu.com/workshop/docs/), configured in `workshop.yaml` and `.workshop/`.

## Workflow

This is the workflow that should be followed:

1. Analyse and read about any tool that you may need to use
2. Make changes
3. Write and run tests for changes

Once the feature is implemented:

1. Build and run all unit tests and linting with `workshop run -- test`
2. Start the production-mode app with `workshop run -- prod`
3. Run all e2e tests in another terminal with `workshop run -- yarn test-e2e`
