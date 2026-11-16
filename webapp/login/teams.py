# Launchpad OpenID Teams Extension support for python-openid
#
# Copyright (C) 2008-2020 Canonical Ltd.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions
# are met:
#
# * Redistributions of source code must retain the above copyright
# notice, this list of conditions and the following disclaimer.
#
# * Redistributions in binary form must reproduce the above copyright
# notice, this list of conditions and the following disclaimer in the
# documentation and/or other materials provided with the distribution.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
# FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
# COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
# INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
# BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
# LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
# ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
# POSSIBILITY OF SUCH DAMAGE.

"""Consumer-side Launchpad Teams extension from django-openid-auth 0.17.

See teams-source.md for upstream source, license and retained semantics.
"""

from openid import oidutil
from openid.extension import Extension
from openid.message import (
    registerNamespaceAlias,
    NamespaceAliasRegistrationError,
)

ns_uri = "http://ns.launchpad.net/2007/openid-teams"

try:
    registerNamespaceAlias(ns_uri, "lp")
except NamespaceAliasRegistrationError as e:
    oidutil.log(
        "registerNamespaceAlias(%r, %r) failed: %s" % (ns_uri, "lp", str(e))
    )


class TeamsNamespaceError(ValueError):
    """The teams namespace could not be created using the alias 'lp'."""


def getTeamsNS(message):
    """Extract the teams namespace, adding the OpenID 1 alias if absent."""
    alias = message.namespaces.getAlias(ns_uri)
    if alias is None:
        try:
            message.namespaces.addAlias(ns_uri, "lp")
        except KeyError as why:
            raise TeamsNamespaceError(why[0])

    return ns_uri


class TeamsRequest(Extension):
    """The Launchpad teams whose membership the consumer requests."""

    ns_alias = "lp"

    def __init__(self, query_membership=None, lp_ns_uri=ns_uri):
        Extension.__init__(self)
        self.query_membership = []
        self.ns_uri = lp_ns_uri

        if query_membership:
            self.requestTeams(query_membership)

    def requestTeam(self, team_name, strict=False):
        """Request a team, ignoring duplicates unless strict is set."""
        if strict:
            if team_name in self.query_membership:
                raise ValueError("That team has already been requested")
        else:
            if team_name in self.query_membership:
                return

        self.query_membership.append(team_name)

    def requestTeams(self, query_membership, strict=False):
        """Add a list of teams to the request, not a bare string."""
        if isinstance(query_membership, str):
            raise TypeError(
                "Teams should be passed as a list of "
                "strings (not %r)" % (type(query_membership),)
            )

        for team_name in query_membership:
            self.requestTeam(team_name, strict=strict)

    def getExtensionArgs(self):
        """Serialize the request's unqualified teams arguments."""
        args = {}

        if self.query_membership:
            args["query_membership"] = ",".join(self.query_membership)

        return args


class TeamsResponse(Extension):
    """Teams returned inside a successful OpenID assertion."""

    ns_alias = "lp"

    def __init__(self, is_member=None, lp_ns_uri=ns_uri):
        Extension.__init__(self)
        if is_member is None:
            self.is_member = []
        else:
            self.is_member = is_member

        self.ns_uri = lp_ns_uri

    _getTeamsNS = staticmethod(getTeamsNS)

    def fromSuccessResponse(cls, success_response, signed_only=True):
        """Extract only signed extension data by default, as upstream does.

        getSignedNS returns None for unsigned/partially signed arguments.
        The resulting TypeError below deliberately retains upstream's
        fail-closed behavior; this dependency change does not relax it.
        """
        self = cls()
        self.ns_uri = self._getTeamsNS(success_response.message)
        if signed_only:
            args = success_response.getSignedNS(self.ns_uri)
        else:
            args = success_response.message.getArgs(self.ns_uri)

        if "is_member" in args:
            is_member_str = args["is_member"]
            self.is_member = is_member_str.split(",")

        return self

    fromSuccessResponse = classmethod(fromSuccessResponse)

    def getExtensionArgs(self):
        """Serialize the response's unqualified teams arguments."""
        ns_args = {"is_member": ",".join(self.is_member)}
        return ns_args
