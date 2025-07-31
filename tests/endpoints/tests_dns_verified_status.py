import json
from json import dumps as _dumps
from unittest.mock import patch, Mock, MagicMock
from tests.endpoints.endpoint_testing import TestEndpoints


class TestDnsVerifiedStatus(TestEndpoints):
    @patch("webapp.helpers.get_dns_verification_token")
    @patch(
        "canonicalwebteam.store_api.devicegw.DeviceGW.get_item_details",
        Mock(return_value={"links": {}}),
    )
    def test_dns_verified_status(self, mock_get_dns_verification_token):
        def dumps_wrapper(*args, **kwargs):
            return _dumps(
                *args,
                **(kwargs | {"default": lambda obj: json.dumps({"links": {}})})
            )

        json.dumps = MagicMock(wraps=dumps_wrapper)

        mock_get_dns_verification_token.return_value = "test-token"

        response = self.client.get("/api/store/test-store-id")

        self.assertEqual(response.status_code, 200)
