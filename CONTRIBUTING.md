# Contributing to snapcraft.io

Thank you for considering contributing to snapcraft.io! We welcome contributions of all kinds, from bug reports and feature requests to code contributions and documentation improvements.

This document provides a set of guidelines for contributing to the snapcraft.io website.

## How to contribute

There are many ways to contribute to the project. Here are a few ideas:

  * **Reporting bugs:** If you find a bug on the site, please report it!
  * **Suggesting enhancements:** Have an idea for a new feature or an improvement to an existing one? We'd love to hear it.
  * **Writing code:** If you're a developer, you can help us by fixing bugs or adding new features.
  * **Improving documentation:** If you see an area of the documentation that could be improved, please let us know.


## Getting started

Before you start, we recommend you familiarize yourself with the project by reading the [`README.md`](README.md) file. It contains an overview of the project and some setup instructions.


## Reporting bugs and suggesting features

If you've found a bug or have an idea for a new feature for the snapcraft.io website, the best way to let us know is by [creating a new issue](https://github.com/canonical/snapcraft.io/issues/new) on our GitHub repository. You can also find a link to create issues in the footer of every page on the site itself.

When creating an issue, please provide as much detail as possible. If you're reporting a bug, include steps to reproduce the issue, what you expected to happen, and what actually happened. If you're suggesting a feature, explain the problem you're trying to solve and how you think the feature would help.

### Bugs in snaps and tools

Please note that this repository is for the snapcraft.io website only. If you have found a bug elsewhere in the Snap ecosystem, please report it in the appropriate place:

  * For issues with an individual **snap**, run `snap info <snap-name>` or visit `snapcraft.io/<snap-name>` and use the contact information provided to get help.
  * For issues with the **snapcraft tool** (which builds and publishes snaps), [file a bug here](https://bugs.launchpad.net/snapcraft).
  * For issues with **snapd** (the daemon that manages snaps on the client), [file a bug here](https://bugs.launchpad.net/snapd).

## Writing code

If you'd like to contribute code to the project, you can do so by creating a pull request. For a more in-depth guide on setting up a local development environment, please refer to [`HACKING.md`](HACKING.md).

### Canonical Contributor License Agreement

Before we can accept your code contribution, you must sign the [Canonical Contributor License Agreement](https://canonical.com/legal/contributors). This is a one-time process that covers all your contributions to Canonical's open source projects.

### Review process

All contributions are subject to review. Please be patient while we review your pull request. We may ask you to make changes or provide additional information.

We usually require two approvals from project maintainers before merging a pull request.

## A note on AI tools

We welcome the use of AI tools and LLMs to assist in your contributions. However, we ask that you be transparent and thorough when using these tools.
Please test and review the AI-generated code *before* creating the pull request: LLM output isn't always entirely correct, so make sure the code actually does what it says it does without introducing unwanted side effects.

While we encourage the use of AI to help you in your work, we want to ensure that the conversations between our engineers and contributors are genuine. Therefore, we require that any comments made during reviews are written by the contributors themselves, not by their LLM tooling. Any comments made by bots or AI tools should be clearly marked as such.

## Community

As part of the Ubuntu community, we expect all contributors to adhere to the [Ubuntu Code of Conduct](https://ubuntu.com/community/docs/ethos/code-of-conduct).

If you have questions or want to discuss ideas, you can join the active [discourse forum](https://forum.snapcraft.io/). We encourage developers to join and participate in the conversation.

