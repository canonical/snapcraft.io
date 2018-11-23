# snapcraft.io

[![CircleCI build status](https://circleci.com/gh/canonical-websites/snapcraft.io.svg?style=shield)](https://circleci.com/gh/canonical-websites/snapcraft.io) [![Code coverage](https://codecov.io/gh/canonical-websites/snapcraft.io/branch/master/graph/badge.svg)](https://codecov.io/gh/canonical-websites/snapcraft.io)

This is the application for [snapcraft.io](https://snapcraft.io) website.

## Local development

The simplest way to run the site locally is to first [install Docker](https://docs.docker.com/engine/installation/) (on Linux you may need to [add your user to the `docker` group](https://docs.docker.com/engine/installation/linux/linux-postinstall/)), and then use the `./run` script:

``` bash
./run
```

Once the containers are setup, you can visit <http://127.0.0.1:8004> in your browser.

### Use staging APIs

To use staging APIs locally you can add the following lines to an `.env.local` file:

```bash
SNAPCRAFT_IO_API=https://api.staging.snapcraft.io/api/v1/
SNAPCRAFT_IO_API_V2=https://api.staging.snapcraft.io/v2/
DASHBOARD_API=https://dashboard.staging.snapcraft.io/dev/api/
DASHBOARD_API_V2=https://dashboard.staging.snapcraft.io/api/v2/
LOGIN_URL=https://login.staging.ubuntu.com
```

### Using Sentry error tracker

For development purposes, visit https://sentry.io/signup/, signup and setup a project. By then you will have a sentry DSN string like:

```
https://<user>:<secret>@sentry.io/<project_id>
```

Create or update you `.env.local` file:

```
SENTRY_DSN=<DSN_FROM_ABOVE>
```

The application will be reporting errors to your `sentry.io` project from now on.


### Building CSS

For working on [Sass files](static/css), you may want to dynamically watch for changes to rebuild the CSS whenever something changes.

To setup the watcher, open a new terminal window and run:

``` bash
./run watch
```

### Testing

``` bash
./run test
```

### Status checks and prometheus metrics

[Talisker](https://talisker.readthedocs.io/en/latest/) provides a bunch of useful status checks and metrics about the running application. Some of this information is sensitive and so to access it you need to run the site with your IP address mentioned in the `TALISKER_NETWORKS` variable:

``` bash
./run --env TALISKER_NETWORKS=172.16.0.0/12
```

Now visit http://127.0.0.1:8004/_status to see the endpoints provided by Talisker. Useful ones include:

- http://127.0.0.1:8004/_status/check - A basic check that the site is running
- http://127.0.0.1:8004/_status/metrics - The prometheus metrics for the application

# Brand stores

To create a brand store, create a file with the name of the store in the folder `webapp/configs`. Then run the project with the environment variable WEBAPP set with the name of the store.

## Example

Let's create the brand store storePlus. First create the file `webapp/configs/storePlus.py`

```python
# webapp/configs/storePlus.py

WEBAPP_CONFIG = {
    'LAYOUT': '_layout-brandstore.html', # custom layout for brandstores
    'STORE_NAME': 'Store Plus',         # Store name displayed in the header
    'STORE_QUERY': 'storePlus',              # Store to query to the snap store
}
```

Then run the project with this command, make sure the WEBAPP has the same name as the brand config file:

```bash
./run --env WEBAPP=storePlus
```
