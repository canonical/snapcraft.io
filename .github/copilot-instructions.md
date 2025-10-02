# Copilot Instructions for snapcraft.io

## Repository Overview

snapcraft.io is the web frontend for the Snap Store. Flask backend (Python 3.10+), React 19/TypeScript frontend, Vite 7 build system. ~166 Python files, ~557 JS/TS files.

**Stack**: Flask, React 19, TypeScript, Vite 7, Vanilla Framework (SCSS), unittest, Vitest, Cypress

## Build Commands (CRITICAL SEQUENCE)

**ALWAYS run in this exact order:**

```bash
pip3 install -r requirements.txt          # ~30-60s
yarn install --immutable                   # ~60-120s (Cypress download may fail in restricted networks - OK to ignore)
yarn run build                             # ~15s - REQUIRED before running app or Python tests
```

**CRITICAL**: `yarn run build` MUST run before Flask app or Python tests. Creates `static/js/dist/vite/` assets required by templates.

## Linting & Testing

```bash
yarn run lint-python  # ~3s: flake8 + black
yarn run lint-js      # ~10s: eslint  
yarn run lint-scss    # ~2s: stylelint
yarn run test-js      # ~90s: vitest (755 tests)
SECRET_KEY=test_key FLASK_DEBUG=0 python3 -m unittest discover tests  # ~35s (469 tests)
yarn run test         # Combined: lint-python + test-python + test-js + lint-scss
```

**IMPORTANT**: Python tests require `SECRET_KEY` env var and built assets (`yarn build` first).

## Running the App

```bash
dotrun                                              # Port 8004 (recommended)
./run serve                                         # Port 8000 (Docker-based)
yarn run build && SECRET_KEY=test_key yarn run serve  # Direct execution
```

## Project Structure

```
webapp/                   # Flask app (blueprints in */views.py)
  ├── app.py             # App factory: create_app()
  ├── config.py          # Env vars: SECRET_KEY, LOGIN_URL, VITE_PORT, ENVIRONMENT
  ├── endpoints/         # API blueprints
  ├── publisher/         # Publisher dashboard
  ├── store/             # Store frontend
  └── vite_integration/  # Vite-Flask integration
static/js/               # React/TypeScript (Jotai state, React Router v7)
  ├── publisher/         # Dashboard components
  ├── public/            # Public-facing JS
  └── dist/vite/         # Built assets (generated, gitignored)
static/sass/             # SCSS (Vanilla Framework)
templates/               # Jinja2 templates (use vite_import() for JS entry points)
tests/                   # Python unittest tests
.github/workflows/       # pr.yml (PR checks), coverage.yml
```

**Key configs**: vite.config.js (build: `static/js/dist/vite/`, dev server: 5173/5004, auto-detects entry points from templates), .env (defaults: PORT=8004, FLASK_DEBUG=true), Dockerfile (multi-stage build)

## CI/CD (.github/workflows/pr.yml)

**Jobs**: run-image (~2min), run-dotrun (~3min), run-cypress (~5min, needs ENVIRONMENT=prod), lint-python/js/scss (~30s-1min, path-filtered), test-python/js (~2min each, path-filtered), check-inclusive-naming

**Requirements**: All dotrun jobs need `sudo chmod -R 777 .` before install. Python tests need `dotrun build` first.

## Known Issues & Workarounds

1. **Cypress download fails in restricted networks**: OK to ignore - build/test works without it
2. **CI needs `sudo chmod -R 777 .`**: Required before `dotrun install` (Docker volume permissions)
3. **Assets required for Python tests**: Always `yarn build` before Python tests or Flask server
4. **vite.config.js uses grep**: Linux-specific template scanning (works in CI)
5. **Deprecation warnings in tests**: `datetime.utcnow()`, Werkzeug warnings are known - ignore

## Common Tasks

**Code change workflow**:
```bash
# Edit files → yarn run build → lint (lint-python/lint-js/lint-scss) → test (test-js or Python tests) → run app
```

**Add React component**: Create in `static/js/`, use `vite_import()` in template for entry points, `yarn build`, add `__tests__/`, `yarn test-js`

**Add Flask endpoint**: Add route in `webapp/*/views.py`, add tests in `tests/*/`, create template if needed, `yarn build` if using JS, test with SECRET_KEY set

**Brand stores**: Create `webapp/configs/<name>.py` with WEBAPP_CONFIG dict, run `./run --env WEBAPP=<name>`

## Key Files

`.env` (dev defaults), `Dockerfile` (multi-stage), `entrypoint` (WSGI), `run` (Docker wrapper), `package.json` (yarn scripts), `requirements.txt` (Python deps), `vite.config.js` (build config), `vitest.config.js` (JS tests), `tsconfig.json`, `eslint.config.mjs`, `.stylelintrc`, `README.md` (quick start), `HACKING.md` (detailed setup), `BRANDSTORES.md`

## Critical Rules

**ALWAYS**: yarn install → yarn build → Flask app/Python tests | Set SECRET_KEY for Python tests | Use `yarn install --immutable` in CI | Lint before commit

**NEVER**: Commit node_modules/, static/js/dist/, coverage/ | Skip `yarn build` after frontend/template changes | Edit static/js/dist/ (generated) | Run Python tests without SECRET_KEY

**TRUST THESE INSTRUCTIONS**: Only search if instructions are incomplete or incorrect. Commands here are validated and work.
