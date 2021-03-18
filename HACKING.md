
# Working on snapcraft.io

## Use staging APIs

To use staging APIs locally you can add the following lines to an `.env.local` file:

```bash
SNAPSTORE_API_URL=https://api.staging.snapcraft.io/
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

Download [this Python script](https://github.com/canonical-web-and-design/build.snapcraft.io/blob/master/scripts/create-launchpad-credentials).

Run:

```bash
$ sudo apt install python-launchpadlib
$ ./create-launchpad-credentials
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

Install the [`dotrun`](https://snapcraft.io/dotrun) snap.

``` bash
dotrun test
```

## Status checks and prometheus metrics

[Talisker](https://talisker.readthedocs.io/en/latest/) provides a bunch of useful status checks and metrics about the running application. Some of this information is sensitive and so to access it you need to run the site with your IP address mentioned in the `TALISKER_NETWORKS` variable.

Now visit http://127.0.0.1:8004/_status to see the endpoints provided by Talisker. Useful ones include:

- http://127.0.0.1:8004/_status/check - A basic check that the site is running
- http://127.0.0.1:8004/_status/metrics - The prometheus metrics for the application

## Update the list of licenses

The licenses that we use are based on the [SPDX Specification](https://spdx.github.io/license-list-data/). In order to have all the products supporting the same set of licenses, the list needs to be synchronised between snapcraft.io, snapd and the snap store.

In case you need to update the license list:
- all the teams need to agree on the version of the list
- once agreed you can copy the list in the file: [./webapp/licenses.json](./webapp/licenses.json)
- Make sure the function `get_licenses()` in the [./webapp/helpers.py](./webapp/helpers.py) is still working

We are supporting some custom licenses (like the Proprietary license). On update of the list, make sure that they have not been included since. This will avoid having duplicate licenses.
