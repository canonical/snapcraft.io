from types import SimpleNamespace
from unittest import TestCase

from openid.consumer.consumer import SuccessResponse
from openid.message import Message, OPENID2_NS

from webapp.login.teams import TeamsRequest, TeamsResponse, ns_uri


class TeamsTest(TestCase):
    def response(self, signed_keys, extra=None, alias="lp"):
        # SuccessResponse represents an assertion already verified by OpenID.
        args = {
            "openid.ns": OPENID2_NS,
            f"openid.ns.{alias}": ns_uri,
            f"openid.{alias}.is_member": "canonical,other-team",
        }
        args.update(extra or {})
        return SuccessResponse(
            SimpleNamespace(claimed_id="https://login.ubuntu.com/test"),
            Message.fromPostArgs(args),
            signed_keys,
        )

    def test_request_serializes_requested_teams(self):
        request = TeamsRequest(["canonical", "other-team", "canonical"])
        self.assertEqual(request.ns_uri, ns_uri)
        self.assertEqual(request.ns_alias, "lp")
        self.assertEqual(
            request.getExtensionArgs(),
            {"query_membership": "canonical,other-team"},
        )

    def test_signed_membership_uses_namespace_uri(self):
        for alias in ("lp", "teams"):
            with self.subTest(alias=alias):
                response = self.response(
                    [f"openid.ns.{alias}", f"openid.{alias}.is_member"],
                    alias=alias,
                )
                self.assertEqual(
                    TeamsResponse.fromSuccessResponse(response).is_member,
                    ["canonical", "other-team"],
                )

    def test_unsigned_membership_is_rejected(self):
        with self.assertRaises(TypeError):
            TeamsResponse.fromSuccessResponse(self.response([]))

    def test_partially_signed_membership_is_rejected(self):
        response = self.response(
            ["openid.ns.lp", "openid.lp.is_member"],
            extra={"openid.lp.extra": "unsigned"},
        )
        with self.assertRaises(TypeError):
            TeamsResponse.fromSuccessResponse(response)
