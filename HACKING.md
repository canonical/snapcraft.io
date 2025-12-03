
# Working on snapcraft.io

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

Once you've created the application, you should be given the client id and the client secret. Update your `.env.local` file with the your secrets:

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

Create or update you `.env.local` file:

```
SENTRY_DSN=<DSN_FROM_ABOVE>
```

The application will be reporting errors to your `sentry.io` project from now on.

## Testing

Install [`dotrun`](https://github.com/canonical/dotrun), then run

``` bash
dotrun test
```

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
