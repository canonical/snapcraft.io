# ![snapcraft.io](https://assets.ubuntu.com/v1/944b8760-snapcraft-logo-bird.svg?fmt=png&w=50 "Snapcraft") snapcraft.io codebase

[![Python Coverage](https://img.shields.io/badge/Python%20Coverage-View%20Report-blue)](https://canonical.github.io/snapcraft.io/coverage/python) [![JavaScript Coverage](https://img.shields.io/badge/JavaScript%20Coverage-View%20Report-blue)](https://canonical.github.io/snapcraft.io/coverage/js)

[![Github Actions Status](https://github.com/canonical/snapcraft.io/actions/workflows/coverage.yml/badge.svg)](https://github.com/canonical/snapcraft.io/actions/workflows/coverage.yml) [![Lighthouse CI](https://github.com/canonical/snapcraft.io/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/canonical/snapcraft.io/actions/workflows/lighthouse.yml) [![Code coverage](https://codecov.io/gh/canonical/snapcraft.io/branch/main/graph/badge.svg)](https://codecov.io/gh/canonical/snapcraft.io)

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

Use [Workshop](https://ubuntu.com/workshop/docs/) to run the site locally. It provides Python and Node.js, installs the project dependencies, and forwards the Flask and Vite ports.

```bash
workshop launch # first-time setup
workshop run -- start
```

Visit `http://127.0.0.1:8004` once the server has started. Vite runs on port 5004 with live reloading. Stop the server with `Ctrl+C`.

For an existing workshop, use `workshop start` if it is stopped, or `workshop refresh` to update dependencies after pulling changes. Put local credentials and configuration overrides in `.env.local`; Workshop loads it after `.env`.

```bash
workshop run -- build             # build frontend assets
workshop run -- test              # build, lint, and run Python/JS tests
workshop run -- yarn test-js      # run a single yarn script
workshop run -- prod              # build and serve without the Vite dev server
```

> Workshop depends on LXD, which is only available on Linux. On macOS or Windows, run Workshop inside a [Multipass](https://canonical.com/multipass) VM. Configure Multipass to use the VirtualBox virtualization driver and allocate at least 4GB RAM and 10GB disk; after setting up the workshop in the VM, enable [port forwarding](https://canonical.com/multipass/docs/stable/how-to-guides/customise-multipass/set-up-the-driver/#use-virtualbox-to-set-up-port-forwarding-for-a-multipass-instance) for ports 8004 and 5004.

For detailed development, testing, and native setup instructions, see [HACKING.md](HACKING.md).

## License

The content of this project is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International license](https://creativecommons.org/licenses/by-sa/4.0/), and the underlying code used to format and display that content is licensed under the [LGPLv3](https://opensource.org/licenses/lgpl-3.0) by [Canonical Ltd](https://canonical.com/).


With ♥ from Canonical
