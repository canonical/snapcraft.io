# AGENTS.md

This file provides guidance to agents when working with code in this repository.

snapcraft.io is the web frontend for the Snap Store: a stateless Flask (Python 3.10+) app serving Jinja2 templates, with React 19 / TypeScript islands bundled by Vite 7 and styled with Vanilla Framework (SCSS).

> A detailed `.github/copilot-instructions.md` exists with build/CI specifics, PR/QA conventions, and review guidelines. Consult it for those; this file focuses on architecture and the commands you'll use most.

## Running commands

Everything runs through **`dotrun`**, which provides the containerized dev environment. Run the app with bare `dotrun`; run any yarn script with `dotrun exec yarn <script>`. Do **not** invoke `yarn` (or `python3`) directly.

```bash
dotrun                                          # Run the app on http://127.0.0.1:8004 (recommended)
                                                #   on macOS/Windows use `dotrun -p 5004:5004` so JS works
dotrun exec yarn build                          # REQUIRED before app/Python tests
dotrun test                                     # Full suite

# Tests
dotrun exec yarn test-js                        # vitest (JS/TS)
dotrun exec yarn test-js path/to/file.test.tsx  # single JS test file
dotrun exec yarn test-python                    # lint-python + Python unittest suite
dotrun exec yarn test-e2e                       # Cypress (needs ENVIRONMENT=prod)

# Lint
dotrun exec yarn lint-python                    # flake8 + black (line length 79)
dotrun exec yarn lint-js                        # eslint
dotrun exec yarn lint-scss                      # stylelint
```

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

## Conventions

- **Use existing Vanilla Framework / `@canonical/react-components` / `@canonical/store-components` components** before building custom UI; keep to Vanilla's design tokens and spacing.
- Black enforces **79-char** lines on Python; rebuild assets (`dotrun exec yarn build`) after any frontend or template change before testing the Flask app.
- Never edit or commit `static/js/dist/` (generated).

## Local dev requiring credentials

Staging APIs, GitHub/Launchpad automated builds, Sentry, and CVE data fetching all need values in `.env.local` — see HACKING.md for the exact variables and setup scripts.

## External packages and libraries

The frontend uses a CSS framework called Vanilla to build components. Examples of these components can be found at https://vanillaframework.io/docs/examples

The tool used to run projects in development is called `dotrun` and is a Python package. There is information on how to use it here: https://pypi.org/project/dotrun/

## Workflow

This is the workflow that should be followed:

1. Analyse and read about any tool that you may need to use
2. Make changes
3. Write and run tests for changes

Once the feature is implemented:

1. Run all the tests with `dotrun test-all`
2. Run linting with `dotrun lint-all`
3. Run all e2e tests `dotrun exec yarn test-e2e`
