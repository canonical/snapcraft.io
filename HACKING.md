
# Working on snapcraft.io

## Development environment

Use [Workshop](https://ubuntu.com/workshop/docs/) for the supported development environment:

```bash
workshop launch
workshop run -- start
```

The setup hook installs Python dependencies into `.venv`, installs JavaScript dependencies from `yarn.lock`, and loads `.env` followed by optional `.env.local` overrides. Flask is available on port 8004 and Vite on port 5004. Use `workshop refresh` after dependency changes.

To run an arbitrary command in the environment, use `workshop exec -- <command>`, or enter `workshop shell` for an interactive shell.

### Native setup (without Workshop)

CI runs checks directly with Python 3.12 and Node.js 24. If you need a native environment, install those plus Yarn, then run:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
yarn install --immutable
set -a
. ./.env
if [ -f .env.local ]; then . ./.env.local; fi
set +a
yarn build
yarn start
```

Load the environment and activate the virtual environment in each new shell before running commands. `yarn build` is required before starting Flask without Vite or running Python tests; do not commit generated `static/js/dist/` assets.

## Use staging APIs

To use staging APIs locally you can add the following lines to an `.env.local` file:

```bash
DEVICEGW_URL=https://api.staging.snapcraft.io/
SNAPSTORE_DASHBOARD_API_URL=https://dashboard.staging.snapcraft.io/
LOGIN_URL=https://login.staging.ubuntu.com
CANDID_API_URL=https://api.staging.jujucharms.com/identity/
```

## Snap automated builds

To use this functionality, you need to set up test accounts with **GitHub** and **Launchpad** to test.

### GitHub

Go and [register a new OAuth application](https://github.com/settings/applications/new) in your GitHub account. You can fill in the form however you want, and the only important detail is that you set the "Authorization callback URL" to `http://localhost:8004/github/auth/verify`.

Once you've created the application, you should be given the client id and the client secret. Update your `.env.local` file with your secrets:

```bash
GITHUB_CLIENT_ID=<Your client id>
GITHUB_CLIENT_SECRET=<Your client secret>
```

#### Use custom GitHub Webhook URL

When you run the project locally, you probably want to link GitHub repos with your local environment; otherwise GitHub won't be able to reach your localhost. You can use a tool like [ngrok](https://ngrok.com/) to proxy to your machine and update the following variable in your `.env.local` file:

```bash
GITHUB_WEBHOOK_HOST_URL=https://hash-id.ngrok.io/
```

### Launchpad

To connect to Launchpad, you need to set up a **username**, a **consumer key** and obtain an **API token** and an **API token secret**:

Download [this Python script](https://github.com/canonical/snapcraft.io/blob/main/scripts/create-launchpad-credentials.py).

Run:

```bash
$ pip install launchpadlib
$ python3 ./scripts/create-launchpad-credentials.py
```

It will print the details needed. If you need complete instructions for obtaining these details, they can be found [here](https://help.launchpad.net/API/SigningRequests).

Update your `.env.local` file:

```bash
LP_API_USERNAME=<Your Launchpad username>
LP_API_TOKEN=<Your Launchpad API token>
LP_API_TOKEN_SECRET=<Your Launchpad API secret>
```

## Using Sentry error tracker

For development purposes, visit https://sentry.io/signup/, signup and setup a project. By then you will have a sentry DSN string like:

```
https://<user>:<secret>@sentry.io/<project_id>
```

Create or update your `.env.local` file:

```
SENTRY_DSN=<DSN_FROM_ABOVE>
```

The application will be reporting errors to your `sentry.io` project from now on.

## Testing

After launching Workshop, run:

```bash
workshop run -- test                      # build + all unit tests and linting
workshop run -- yarn test-js              # JavaScript tests
workshop run -- yarn test-js path/to/file.test.tsx
workshop run -- build                     # required before Python tests
workshop run -- yarn test-python          # Python lint + unit tests
workshop run -- yarn lint-js
workshop run -- yarn lint-scss
workshop run -- yarn lint-python
```

For end-to-end tests, start `workshop run -- prod` in one terminal and run `workshop run -- yarn test-e2e` in another. Workshop installs the system libraries and virtual display required by Cypress; native environments need the [Cypress Linux prerequisites](https://docs.cypress.io/app/get-started/install-cypress#Linux-Prerequisites). These tests use live Store APIs, so upstream timeouts can cause failures.

JavaScript tests run in UTC for consistent date/time assertions across local machines and CI. The worker pool is capped at four to avoid oversubscribing large Workshop hosts.

In a native environment, use the same Yarn commands without the `workshop run --` wrapper after loading the environment as above.

## Adding new Publicise SVG Badges

1. Take a look under `static/images/badges_editable/`; and pick another language to use as a template. For example, `en` (English), for LTR; `ar` (Arabic), for RTL; etc. **If you find none of the existing languages suitable for your template, you may modify the `x` and `y` coordinates for text to your liking, however the changes & positioning should be consistent with other badges, no modifications or appendages to the logo is allowed**
2. Place the new badge under `static/images/badges_editable/<language_tag>/snap-store-<color>.svg`. Do not directly place under `badges`; running this script will overwrite a file already present.
3. Install Inkscape CLI via `sudo apt install inkscape` or `sudo snap install inkscape`. (*Ubuntu environment is assumed, feel free to use your distro specific installation methods*)
4. Install scour via `pip install scour` or `sudo apt install python3-scour` to minify generated badges.
5. Run `python scripts/generate-minified-badges.py` to convert. (*Use `python3` if your distro does not automatically alias it*)
6. Make equivalent changes under `static/js/publisher/pages/Publicise/PubliciseButtons.tsx`, specifically inside `LANGUAGES` object
7. **Important** Test your changes to ensure they work. When testing locally, change the values of `darkBadgeSource` & `lightBadgeSource` in the above file, to point to `http://localhost:8004` (or whichever port is set via `.env`), for the badges to render.

## Update the list of licenses

The licenses that we use are based on the [SPDX Specification](https://spdx.github.io/license-list-data/). In order to have all the products supporting the same set of licenses, the list needs to be synchronised between snapcraft.io, snapd and the snap store.

In case you need to update the license list:
- all the teams need to agree on the version of the list
- once agreed you can copy the list in the file: [./webapp/licenses.json](./webapp/licenses.json)
- Make sure the function `get_licenses()` in the [./webapp/helpers.py](./webapp/helpers.py) is still working

We are supporting some custom licenses (like the Proprietary license). On update of the list, make sure that they have not been included since. This will avoid having duplicate licenses.

## Fetching CVE Data
When the app is run locally, a GitHub personal access token is required to fetch the CVE data. Make sure you have access to the [canonicalwebteam.snap-cves](https://github.com/canonical/canonicalwebteam.snap-cves) repository. After creating a GitHub classic personal access token, follow the steps described in [GitHub's documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#personal-access-tokens-classic).
Then, add this token to the .env.local file with the key GITHUB_SNAPCRAFT_BOT_USER_TOKEN.

## Vite setup details
This project relies on Vite for processing and bundling TypeScript and SCSS source files; referencing these files and the resulting bundles in templates is done through a `vite_import` template function provided by the [Canonical Webteam Flask-Vite integration](https://github.com/canonical/canonicalwebteam.flask-vite) package. The extension is configured via `VITE_*` variables that get loaded into the Flask `app.config` object where the extension reads them from.
Files referenced via `vite_import` are automatically detected and added as entry points in the Vite config when running the build command.
