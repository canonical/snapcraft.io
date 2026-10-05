import responses
from pymacaroons import Macaroon

from tests.publisher.endpoint_testing import BaseTestCases
from webapp.authentication import SCA_DISCHARGE_COOKIE, SCA_ROOT_COOKIE


class GetAgreementPage(BaseTestCases.BaseAppTesting):
    def setUp(self):
        endpoint_url = "/account/agreement"
        super().setUp(snap_name=None, api_url=None, endpoint_url=endpoint_url)

    @responses.activate
    def test_agreement_logged_in(self):
        self._log_in(self.client)
        response = self.client.get("/account/agreement")

        assert response.status_code == 200
        self.assert_template_used(
            "publisher/developer_programme_agreement.html"
        )


class PostAgreementPage(BaseTestCases.EndpointLoggedIn):
    def setUp(self):
        api_url = "https://dashboard.snapcraft.io/dev/api/agreement/"
        data = {"i_agree": "on"}
        endpoint_url = "/account/agreement"

        super().setUp(
            snap_name=None,
            endpoint_url=endpoint_url,
            api_url=api_url,
            method_endpoint="POST",
            method_api="POST",
            data=data,
        )

    @responses.activate
    def test_post_agreement_on(self):
        responses.add(responses.POST, self.api_url, json={}, status=200)

        response = self.client.post(self.endpoint_url, data={"i_agree": "on"})

        self.assertEqual(1, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(self.api_url, called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get("Authorization")
        )
        self.assertEqual(called.response.json(), {})
        self.assertEqual(b'{"latest_tos_accepted": true}', called.request.body)

        self.assertEqual(302, response.status_code)
        self.assertEqual("/account/", response.location)

    @responses.activate
    def test_post_agreement_off(self):
        response = self.client.post(self.endpoint_url, data={"i_agree": "off"})

        self.assertEqual(302, response.status_code)
        self.assertEqual("/account/agreement", response.location)


class PostAgreementMigratesOnboardingMacaroons(BaseTestCases.BaseAppTesting):
    def setUp(self):
        super().setUp(
            snap_name=None,
            api_url="https://dashboard.snapcraft.io/dev/api/agreement/",
            endpoint_url="/account/agreement",
        )

    @responses.activate
    def test_root_and_discharge_are_moved_to_cookies(self):
        # Regression test: a publisher who hit the account-not-found path
        # at login keeps root+discharge in the session (see
        # webapp/login/views.py:after_login) until the agreement is
        # accepted; that must migrate them to the scoped cookies rather
        # than leaving them in the session cookie forever.
        root = Macaroon(location="store", identifier="root", key="root-key")
        root.add_third_party_caveat(
            "login.ubuntu.com", "caveat-key", "caveat-id"
        )
        discharge = Macaroon(
            location="login.ubuntu.com",
            identifier="caveat-id",
            key="caveat-key",
        )

        with self.client.session_transaction() as s:
            s["publisher"] = {
                "identity_url": "https://login.ubuntu.com/test",
                "nickname": "test",
                "fullname": "Test",
                "image": None,
                "email": "test@test.com",
            }
            s["macaroon_root"] = root.serialize()
            s["macaroon_discharge"] = discharge.serialize()

        responses.add(responses.POST, self.api_url, json={}, status=200)
        responses.add(
            responses.POST,
            "https://api.charmhub.io/v1/tokens/dashboard/exchange",
            json={"macaroon": "exchanged-macaroon"},
            status=200,
        )

        response = self.client.post(self.endpoint_url, data={"i_agree": "on"})

        self.assertEqual(302, response.status_code)
        with self.client.session_transaction() as s:
            self.assertEqual(s["macaroon_exchanged"], "exchanged-macaroon")
            self.assertNotIn("macaroon_root", s)
            self.assertNotIn("macaroon_discharge", s)

        cookie_headers = response.headers.get_all("Set-Cookie")
        self.assertTrue(
            any(
                header.startswith(f"{SCA_ROOT_COOKIE}=")
                for header in cookie_headers
            )
        )
        self.assertTrue(
            any(
                header.startswith(f"{SCA_DISCHARGE_COOKIE}=")
                for header in cookie_headers
            )
        )
