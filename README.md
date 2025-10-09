# ![snapcraft.io](https://assets.ubuntu.com/v1/944b8760-snapcraft-logo-bird.svg?fmt=png&w=50 "Snapcraft") snapcraft.io codebase

[![Python Coverage](https://img.shields.io/badge/Python%20Coverage-View%20Report-blue)](https://canonical.github.io/snapcraft.io/coverage/python) [![JavaScript Coverage](https://img.shields.io/badge/JavaScript%20Coverage-View%20Report-blue)](https://canonical.github.io/snapcraft.io/coverage/js)

[![Github Actions Status](https://github.com/canonical/snapcraft.io/actions/workflows/coverage.yml/badge.svg)](https://github.com/canonical/snapcraft.io/actions/workflows/coverage.yml) [![Code coverage](https://codecov.io/gh/canonical/snapcraft.io/branch/main/graph/badge.svg)](https://codecov.io/gh/canonical/snapcraft.io)

Snaps are applications packaged with all their dependencies to run on all popular Linux distributions from a single build. They update automatically and roll back gracefully. This repo is the application for the [snapcraft.io](https://snapcraft.io) website.

If you are interested in Snaps, Snapping and Snapcraft, there is an active [discourse forum](https://forum.snapcraft.io/) that we encourage developers to join.

The site is largely maintained by the [Web and Design team](https://ubuntu.com/blog/topics/design) at [Canonical](https://canonical.com/). It is a stateless website project based on [Flask](https://flask.palletsprojects.com/en/1.1.x/) and hosted on a [Charmed Kubernetes](https://ubuntu.com/kubernetes) cluster.


## Bugs and issues

If you have found a bug on the site or have an idea for a new feature, feel free to [create a new issue](https://github.com/canonical/snapcraft.io/issues/new), or suggest a fix by [creating a pull request](https://help.github.com/articles/creating-a-pull-request/). You can also find a link to create issues in the footer of every page of the site itself.

### Bugs in snaps and tools

If you have found a bug elsewhere in the snap world:

- For issues with an individual **snap** - you can run `snap info` and use the *contact information* to find where you can get help.
- In the **snapcraft tool** - that builds and publishes snaps, [file it here](https://bugs.launchpad.net/snapcraft)
- In **Snapd**, the daemon that manages snaps on the client, [file it here](https://bugs.launchpad.net/snapd)


## Local development

The simplest way to run the site locally is using [`dotrun`](https://github.com/canonical/dotrun):

```bash
dotrun
```

Once the server has started, you can visit `http://127.0.0.1:8004` in your browser. You stop the server using `<ctrl>+c`.

> If you're running dotrun on macOS or Windows, you will have to use a different command to launch dotrun with an additional argument in order to get JavaScript code working:
```bash
dotrun -p 5004:5004
```

For more detailed local development instructions, see [HACKING.md](HACKING.md).

## License

The content of this project is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International license](https://creativecommons.org/licenses/by-sa/4.0/), and the underlying code used to format and display that content is licensed under the [LGPLv3](https://opensource.org/licenses/lgpl-3.0) by [Canonical Ltd](https://canonical.com/).


With ♥ from Canonical
