from unittest.mock import patch

from tests.endpoints.endpoint_testing import TestEndpoints


class TestInvites(TestEndpoints):
    @patch("canonicalwebteam.store_api.dashboard.Dashboard.get_store_invites")
    def test_get_invites(self, mock_get_store_invites):
        mock_invites_data = [
            {
                "id": "invite-1",
                "email": "user1@example.com",
                "status": "pending",
                "roles": ["admin"],
                "created_at": "2025-01-01T10:00:00Z",
            },
            {
                "id": "invite-2",
                "email": "user2@example.com",
                "status": "accepted",
                "roles": ["view"],
                "created_at": "2025-01-02T11:00:00Z",
            },
        ]

        mock_get_store_invites.return_value = mock_invites_data

        response = self.client.get("/api/store/test-store-id/invites")
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data, mock_invites_data)
