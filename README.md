# snapcraft.io

This is the new [Flask](http://flask.pocoo.org/) application that will gradually replace the website at https://snapcraft.io, starting with the snap details page.

## Local development

The simplest way to run the site locally is to first [install Docker](https://docs.docker.com/engine/installation/) (on Linux you may need to [add your user to the `docker` group](https://docs.docker.com/engine/installation/linux/linux-postinstall/)), and then use the `./run` script:

``` bash
./run
```

Once the containers are setup, you can visit <http://127.0.0.1:8004> in your browser.

### Use staging APIs

To use staging APIs locally you can add the following lines to an`.env.local` file:

```bash
SNAPCRAFT_IO_API=https://api.staging.snapcraft.io/api/v1/
DASHBOARD_API=https://dashboard.staging.snapcraft.io/dev/api/
SEARCH_API=https://search.apps.staging.ubuntu.com/api/v1/
LOGIN_URL=https://login.staging.ubuntu.com
```

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

