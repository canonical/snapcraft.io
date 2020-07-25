
# Working on snapcraft.io

## Use staging APIs

To use staging APIs locally you can add the following lines to an `.env.local` file:

```bash
SNAPCRAFT_IO_API=https://api.staging.snapcraft.io/api/v1/
SNAPCRAFT_IO_API_V2=https://api.staging.snapcraft.io/v2/
DASHBOARD_API=https://dashboard.staging.snapcraft.io/dev/api/
DASHBOARD_API_V2=https://dashboard.staging.snapcraft.io/api/v2/
LOGIN_URL=https://login.staging.ubuntu.com
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


## Building CSS

For working on [Sass files](static/css), you may want to dynamically watch for changes to rebuild the CSS whenever something changes.

To setup the watcher, open a new terminal window and run:

``` bash
./run watch
```

## Testing

``` bash
./run test
```

## Status checks and prometheus metrics

[Talisker](https://talisker.readthedocs.io/en/latest/) provides a bunch of useful status checks and metrics about the running application. Some of this information is sensitive and so to access it you need to run the site with your IP address mentioned in the `TALISKER_NETWORKS` variable:

``` bash
./run --env TALISKER_NETWORKS=172.16.0.0/12
```

Now visit http://127.0.0.1:8004/_status to see the endpoints provided by Talisker. Useful ones include:

- http://127.0.0.1:8004/_status/check - A basic check that the site is running
- http://127.0.0.1:8004/_status/metrics - The prometheus metrics for the application
