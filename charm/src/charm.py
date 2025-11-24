#!/usr/bin/env python3

"""Flask Charm entrypoint."""

import logging
import typing

import ops

import paas_charm.flask

logger = logging.getLogger(__name__)


class SnapcraftCharm(paas_charm.flask.Charm):
    """Flask Charm service."""

    def __init__(self, *args: typing.Any) -> None:
        """Initialize the instance.

        Args:
            args: passthrough to CharmBase.
        """
        super().__init__(*args)


if __name__ == "__main__":
    ops.main(SnapcraftCharm)

