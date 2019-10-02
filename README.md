# ![snapcraft.io](https://assets.ubuntu.com/v1/f46fbbb9-snapcraft-logo--web.png "Snapcraft").io codebase

[![CircleCI build status](https://circleci.com/gh/canonical-web-and-design/snapcraft.io.svg?style=shield)](https://circleci.com/gh/canonical-web-and-design/snapcraft.io) [![Code coverage](https://codecov.io/gh/canonical-web-and-design/snapcraft.io/branch/master/graph/badge.svg)](https://codecov.io/gh/canonical-web-and-design/snapcraft.io)

Snaps are applications packaged with all their dependencies to run on all popular Linux distributions from a single build. They update automatically and roll back gracefully. This repo is the application for the [snapcraft.io](https://snapcraft.io) website.

If you are interested in Snaps, Snapping and Snapcraft, there is an active [discourse forum](https://forum.snapcraft.io/) that we encourage developers to join.

The site is largely maintained by the [Web and Design team](https://ubuntu.com/blog/topics/design) at [Canonical](https://www.canonical.com). It is a simple, stateless website project based on [Flask](https://flask.palletsprojects.com/en/1.1.x/) and hosted on a [Charmed Kubernetes](https://ubuntu.com/kubernetes) cluster.


## Bugs and issues

If you have found a bug on the site or have an idea for a new feature, feel free to [create a new issue](https://github.com/canonical-web-and-design/snapcraft.io/issues/new), or suggest a fix by [creating a pull request](https://help.github.com/articles/creating-a-pull-request/). You can also find a link to create issues in the footer of every page of the site itself.

### Bugs in snaps and tools

If you have found a bug elsewhere in the snap world:

- For issues with an individual **snap** - you can run `snap info` and use the *contact information* to find where you can get help.
- In the **snapcraft tool** - that builds and publishes snaps, [file it here](https://bugs.launchpad.net/snapcraft)
- In **Snapd**, the daemon that manages snaps on the client, [file it here](https://bugs.launchpad.net/snapd)


## Local development

The simplest way to run the site locally is to first [install Docker](https://docs.docker.com/engine/installation/) (on Linux you may need to [add your user to the `docker` group](https://docs.docker.com/engine/installation/linux/linux-postinstall/)), and then use the `./run` script:

``` bash
./run
```

Once the containers are setup, you can visit <http://127.0.0.1:8004> in your browser.

For more detailed local development instructions, see [HACKING.md](HACKING.md).

## Brand stores

This codebase can be modified to setup branded stores that represent specific brand or devices, giving the brand full control over the store content, reviewing process and identity.

- [For companies looking to develop a brand store with Canonical&nbsp;&rsaquo;](https://docs.ubuntu.com/core/en/build-store/create.html
)
- For developers to learn more about developomg a brandstore, see [BRANDSTORES.md](BRANDSTORES.md).


## License

The content of this project is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International license](https://creativecommons.org/licenses/by-sa/4.0/), and the underlying code used to format and display that content is licensed under the [LGPLv3](http://opensource.org/licenses/lgpl-3.0.html) by [Canonical Ltd](http://www.canonical.com/).


With ♥ from Canonical
