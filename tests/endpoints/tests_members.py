from unittest.mock import patch
from tests.endpoints.endpoint_testing import TestEndpoints


class TestGetManageMembers(TestEndpoints):
    @patch("canonicalwebteam.store_api.dashboard.Dashboard.get_store_members")
    def test_get_manage_members_success(self, mock_get_store_members):
        mock_get_store_members.return_value = [
            {
                "email": "user1@example.com",
                "role": "admin",
                "name": "User One",
            },
            {
                "email": "testing@testing.com",
                "role": "member",
                "name": "Test User",
            },
            {
                "email": "user2@example.com",
                "role": "member",
                "name": "User Two",
            },
        ]

        response = self.client.get("/api/store/1/members")
        data = response.json

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 3)

        # Check that current user is marked correctly
        current_user = next(
            (user for user in data if user.get("current_user")), None
        )
        self.assertIsNotNone(current_user)
        self.assertEqual(current_user["email"], "testing@testing.com")
        self.assertTrue(current_user["current_user"])
