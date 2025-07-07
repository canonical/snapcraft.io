#! /usr/bin/python

from __future__ import print_function

from argparse import ArgumentParser
import sys

from launchpadlib.credentials import (
    CredentialStore,
    RequestTokenAuthorizationEngine,
    )
from launchpadlib.launchpad import Launchpad
from launchpadlib.uris import lookup_service_root


class MemoryCredentialStore(CredentialStore):
    """Store OAuth credentials in memory."""

    def __init__(self, *args, **kwargs):
        super(MemoryCredentialStore, self).__init__(*args, **kwargs)
        self.store = {}

    def do_save(self, credentials, unique_key):
        self.store[unique_key] = credentials

    def do_load(self, unique_key):
        return self.store.get(unique_key)


class AuthorizeRequestTokenRemotely(RequestTokenAuthorizationEngine):
    """Ask the user to authorize the request token in a remote browser."""

    def make_end_user_authorize_token(self, credentials, request_token):
        authorization_url = self.authorization_url(request_token)
        print("Visit the authorization page in a browser logged in as the "
              "desired Launchpad user:")
        print("  {}".format(authorization_url))
        print("Press Enter here when you have authorized the token.")
        sys.stdin.readline()
        credentials.exchange_request_token_for_access_token(self.web_root)


def main():
    parser = ArgumentParser()
    parser.add_argument(
        "-l", "--launchpad", dest="launchpad_instance", default="production",
        help=(
            "Launchpad instance (production, staging, qastaging, dogfood, "
            "dev, or a URI); defaults to production"))
    args = parser.parse_args()

    service_root = lookup_service_root(args.launchpad_instance)
    store = MemoryCredentialStore()
    authorization_engine = AuthorizeRequestTokenRemotely(
        service_root, consumer_name="build.snapcraft.io.development",
        allow_access_levels=["WRITE_PRIVATE"])
    lp = Launchpad.login_with(
        service_root=service_root, authorization_engine=authorization_engine,
        credential_store=store)
    creds = store.store.values()[0]
    print("Now set the following values in environments/development.env, and "
          "make sure to keep them private (including 'chmod 600') as they "
          "allow full access to your Launchpad account:")

    with open(".env.local", "a") as f:
        print("LP_API_URL={}".format(service_root.rstrip("/")), file=f)
        print("LP_API_USERNAME={}".format(lp.me.name), file=f)
        print("LP_API_CONSUMER_KEY={}".format(creds.consumer.key), file=f)
        print("LP_API_TOKEN={}".format(creds.access_token.key), file=f)
        print("LP_API_TOKEN_SECRET={}".format(creds.access_token.secret), file=f)


if __name__ == "__main__":
    main()