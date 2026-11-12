from types import SimpleNamespace
from unittest import TestCase

from openid.consumer.consumer import SuccessResponse
from openid.consumer.consumer import AuthRequest
from openid.consumer.discover import OpenIDServiceEndpoint, OPENID_2_0_TYPE
from openid.message import Message, OPENID1_NS, OPENID2_NS

from webapp.login.teams import TeamsRequest, TeamsResponse, ns_uri


class TeamsRequestTest(TestCase):
    def test_request_serializes_namespace_alias_and_membership(self):
        endpoint = OpenIDServiceEndpoint()
        endpoint.type_uris = [OPENID_2_0_TYPE]
        request = AuthRequest(endpoint, None)
        request.addExtension(
            TeamsRequest(["canonical", "other-team", "canonical"])
        )
        args = request.message.toPostArgs()
        self.assertEqual(args["openid.ns.lp"], ns_uri)
        self.assertEqual(
            args["openid.lp.query_membership"], "canonical,other-team"
        )

    def test_empty_request_has_no_membership_argument(self):
        self.assertEqual(TeamsRequest().getExtensionArgs(), {})
        self.assertEqual(TeamsRequest([]).getExtensionArgs(), {})

    def test_bare_string_is_rejected(self):
        with self.assertRaises(TypeError):
            TeamsRequest("canonical")

    def test_duplicate_team_is_rejected_in_strict_mode(self):
        request = TeamsRequest(["canonical"])
        with self.assertRaises(ValueError):
            request.requestTeams(["canonical"], strict=True)


class TeamsResponseTest(TestCase):
    def response(self, args, signed_keys=()):
        message = Message.fromPostArgs(args)
        return SuccessResponse(
            SimpleNamespace(claimed_id="https://login.ubuntu.com/test"),
            message,
            signed_keys,
        )

    def test_signed_membership_preserves_comma_separated_values(self):
        response = self.response(
            {
                "openid.ns": OPENID2_NS,
                "openid.ns.lp": ns_uri,
                "openid.lp.is_member": "canonical,other-team,canonical",
            },
            ["openid.ns.lp", "openid.lp.is_member"],
        )
        teams = TeamsResponse.fromSuccessResponse(response)
        self.assertEqual(
            teams.is_member, ["canonical", "other-team", "canonical"]
        )
        self.assertEqual(
            teams.getExtensionArgs(),
            {"is_member": "canonical,other-team,canonical"},
        )

    def test_empty_membership_retains_upstream_empty_string_value(self):
        response = self.response(
            {"openid.ns.lp": ns_uri, "openid.lp.is_member": ""},
            ["openid.lp.is_member"],
        )
        self.assertEqual(
            TeamsResponse.fromSuccessResponse(response).is_member, [""]
        )

    def test_absent_membership_is_empty(self):
        response = self.response({"openid.ns": OPENID2_NS})
        self.assertEqual(
            TeamsResponse.fromSuccessResponse(response).is_member, []
        )

    def test_unsigned_membership_retains_upstream_fail_closed_error(self):
        response = self.response(
            {"openid.ns.lp": ns_uri, "openid.lp.is_member": "canonical"}
        )
        with self.assertRaises(TypeError):
            TeamsResponse.fromSuccessResponse(response)

    def test_partially_signed_namespace_retains_fail_closed_error(self):
        response = self.response(
            {
                "openid.ns.lp": ns_uri,
                "openid.lp.is_member": "canonical",
                "openid.lp.extra": "unsigned",
            },
            ["openid.lp.is_member"],
        )
        with self.assertRaises(TypeError):
            TeamsResponse.fromSuccessResponse(response)

    def test_explicit_unsigned_opt_out_remains_available(self):
        response = self.response(
            {"openid.ns.lp": ns_uri, "openid.lp.is_member": "canonical"}
        )
        self.assertEqual(
            TeamsResponse.fromSuccessResponse(
                response, signed_only=False
            ).is_member,
            ["canonical"],
        )

    def test_openid1_uses_registered_implicit_launchpad_namespace(self):
        response = self.response(
            {"openid.lp.is_member": "canonical"},
            ["openid.lp.is_member"],
        )
        self.assertEqual(response.message.getOpenIDNamespace(), OPENID1_NS)
        self.assertEqual(response.message.namespaces.getAlias(ns_uri), "lp")
        self.assertEqual(
            TeamsResponse.fromSuccessResponse(response).is_member,
            ["canonical"],
        )

    def test_openid2_uses_namespace_uri_not_fixed_alias(self):
        response = self.response(
            {
                "openid.ns": OPENID2_NS,
                "openid.ns.teams": ns_uri,
                "openid.teams.is_member": "canonical",
            },
            ["openid.ns.teams", "openid.teams.is_member"],
        )
        self.assertEqual(
            TeamsResponse.fromSuccessResponse(response).is_member,
            ["canonical"],
        )

    def test_conflicting_namespace_retains_upstream_fail_closed_error(self):
        response = self.response(
            {
                "openid.ns": OPENID2_NS,
                "openid.ns.lp": "https://example.com/not-teams",
                "openid.lp.is_member": "canonical",
            },
            ["openid.ns.lp", "openid.lp.is_member"],
        )
        with self.assertRaises(TypeError):
            TeamsResponse.fromSuccessResponse(response)
