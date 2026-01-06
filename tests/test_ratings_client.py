import unittest
from unittest.mock import MagicMock, patch
import grpc

from webapp.ratings.ratings_client import RatingsClient


class TestRatingsClient(unittest.TestCase):
    """Tests for the RatingsClient class."""

    def setUp(self):
        """Set up test fixtures."""
        self.channel_address = "ratings.example.com:443"

    @patch("webapp.ratings.ratings_client.grpc.secure_channel")
    @patch("webapp.ratings.ratings_client.grpc.ssl_channel_credentials")
    def test_init_secure_channel(self, mock_ssl_creds, mock_secure_channel):
        """Test client initialization with SSL."""
        mock_channel = MagicMock()
        mock_secure_channel.return_value = mock_channel
        mock_creds = MagicMock()
        mock_ssl_creds.return_value = mock_creds

        client = RatingsClient(self.channel_address, use_ssl=True)

        mock_ssl_creds.assert_called_once()
        mock_secure_channel.assert_called_once_with(
            self.channel_address, mock_creds
        )
        self.assertEqual(client.channel, mock_channel)
        self.assertTrue(client.use_ssl)
        self.assertEqual(client.timeout, 30.0)

    @patch("webapp.ratings.ratings_client.grpc.insecure_channel")
    def test_init_insecure_channel(self, mock_insecure_channel):
        """Test client initialization without SSL."""
        mock_channel = MagicMock()
        mock_insecure_channel.return_value = mock_channel

        client = RatingsClient(self.channel_address, use_ssl=False)

        mock_insecure_channel.assert_called_once_with(self.channel_address)
        self.assertEqual(client.channel, mock_channel)
        self.assertFalse(client.use_ssl)

    @patch("webapp.ratings.ratings_client.grpc.insecure_channel")
    @patch(
        "webapp.ratings.ratings_client.ratings_features_user_pb2_grpc.UserStub"
    )
    def test_authenticate_success(self, mock_user_stub, mock_channel):
        """Test successful authentication."""
        mock_channel_instance = MagicMock()
        mock_channel.return_value = mock_channel_instance

        mock_stub_instance = MagicMock()
        mock_user_stub.return_value = mock_stub_instance

        mock_response = MagicMock()
        mock_response.token = "test-token-123"
        mock_stub_instance.Authenticate.return_value = mock_response

        client = RatingsClient(self.channel_address, use_ssl=False)
        token = client._authenticate()

        self.assertEqual(token, "test-token-123")
        mock_stub_instance.Authenticate.assert_called_once()

    @patch("webapp.ratings.ratings_client.grpc.insecure_channel")
    @patch(
        "webapp.ratings.ratings_client.ratings_features_user_pb2_grpc.UserStub"
    )
    def test_authenticate_empty_token(self, mock_user_stub, mock_channel):
        """Test authentication when empty token is returned."""
        mock_channel_instance = MagicMock()
        mock_channel.return_value = mock_channel_instance

        mock_stub_instance = MagicMock()
        mock_user_stub.return_value = mock_stub_instance

        mock_response = MagicMock()
        mock_response.token = ""
        mock_stub_instance.Authenticate.return_value = mock_response

        client = RatingsClient(self.channel_address, use_ssl=False)
        token = client._authenticate()

        self.assertIsNone(token)

    @patch("webapp.ratings.ratings_client.grpc.insecure_channel")
    @patch(
        "webapp.ratings.ratings_client.ratings_features_user_pb2_grpc.UserStub"
    )
    def test_authenticate_grpc_error(self, mock_user_stub, mock_channel):
        """Test authentication when gRPC error occurs."""
        mock_channel_instance = MagicMock()
        mock_channel.return_value = mock_channel_instance

        mock_stub_instance = MagicMock()
        mock_user_stub.return_value = mock_stub_instance

        # Create a mock gRPC error
        mock_error = MagicMock(spec=grpc.RpcError)
        mock_error.code = MagicMock(return_value=grpc.StatusCode.UNAVAILABLE)
        mock_error.details = MagicMock(return_value="Service unavailable")
        mock_stub_instance.Authenticate.side_effect = mock_error

        client = RatingsClient(self.channel_address, use_ssl=False)
        token = client._authenticate()

        self.assertIsNone(token)

    @patch("webapp.ratings.ratings_client.grpc.insecure_channel")
    @patch(
        "webapp.ratings.ratings_client.ratings_features_user_pb2_grpc.UserStub"
    )
    def test_authenticate_unexpected_error(self, mock_user_stub, mock_channel):
        """Test authentication when unexpected error occurs."""
        mock_channel_instance = MagicMock()
        mock_channel.return_value = mock_channel_instance

        mock_stub_instance = MagicMock()
        mock_user_stub.return_value = mock_stub_instance
        mock_stub_instance.Authenticate.side_effect = Exception(
            "Unexpected error"
        )

        client = RatingsClient(self.channel_address, use_ssl=False)
        token = client._authenticate()

        self.assertIsNone(token)

    @patch("webapp.ratings.ratings_client.grpc.insecure_channel")
    @patch(
        "webapp.ratings.ratings_client.ratings_features_app_pb2_grpc.AppStub"
    )
    def test_get_snap_rating_success(self, mock_app_stub, mock_channel):
        """Test successful snap rating fetch."""
        mock_channel_instance = MagicMock()
        mock_channel.return_value = mock_channel_instance

        mock_stub_instance = MagicMock()
        mock_app_stub.return_value = mock_stub_instance

        # Mock the rating response
        mock_rating = MagicMock()
        mock_rating.snap_id = "test-snap-id"
        mock_rating.total_votes = 100
        mock_rating.ratings_band = 4  # VERY_GOOD

        mock_response = MagicMock()
        mock_response.rating = mock_rating
        mock_stub_instance.GetRating.return_value = mock_response

        client = RatingsClient(self.channel_address, use_ssl=False)
        client.token = "test-token"

        ratings_band_path = (
            "webapp.ratings.ratings_client."
            "ratings_features_common_pb2.RatingsBand.Name"
        )
        with patch(ratings_band_path, return_value="VERY_GOOD"):
            result = client.get_snap_rating("test-snap-id")

        self.assertIsNotNone(result)
        self.assertEqual(result["snap_id"], "test-snap-id")
        self.assertEqual(result["total_votes"], 100)
        self.assertEqual(result["ratings_band"], "very-good")
        mock_stub_instance.GetRating.assert_called_once()

    @patch("webapp.ratings.ratings_client.grpc.insecure_channel")
    def test_get_snap_rating_no_token(self, mock_channel):
        """Test snap rating fetch when not authenticated."""
        mock_channel_instance = MagicMock()
        mock_channel.return_value = mock_channel_instance

        client = RatingsClient(self.channel_address, use_ssl=False)

        # Mock _authenticate to return None
        with patch.object(client, "_authenticate", return_value=None):
            result = client.get_snap_rating("test-snap-id")

        self.assertIsNone(result)

    @patch("webapp.ratings.ratings_client.grpc.insecure_channel")
    @patch(
        "webapp.ratings.ratings_client.ratings_features_app_pb2_grpc.AppStub"
    )
    def test_get_snap_rating_unauthenticated_retry(
        self, mock_app_stub, mock_channel
    ):
        """Test snap rating fetch retries on auth failure."""
        mock_channel_instance = MagicMock()
        mock_channel.return_value = mock_channel_instance

        # Create a real exception-like mock
        class MockRpcError(grpc.RpcError, Exception):
            def code(self):
                return grpc.StatusCode.UNAUTHENTICATED

            def details(self):
                return "Token expired"

        mock_error = MockRpcError()

        mock_rating = MagicMock()
        mock_rating.snap_id = "test-snap-id"
        mock_rating.total_votes = 50
        mock_rating.ratings_band = 3  # GOOD

        mock_response = MagicMock()
        mock_response.rating = mock_rating

        # Setup stub to fail first, succeed second
        mock_stub_instance = MagicMock()
        mock_stub_instance.GetRating.side_effect = [mock_error, mock_response]
        mock_app_stub.return_value = mock_stub_instance

        client = RatingsClient(self.channel_address, use_ssl=False)
        client.token = "old-token"

        ratings_band_path = (
            "webapp.ratings.ratings_client."
            "ratings_features_common_pb2.RatingsBand.Name"
        )
        # Mock authentication to return a new token
        with patch.object(
            client, "_authenticate", return_value="new-token"
        ) as mock_auth:
            with patch(ratings_band_path, return_value="GOOD"):
                result = client.get_snap_rating("test-snap-id")

        # Verify authentication was called
        mock_auth.assert_called_once()
        self.assertIsNotNone(result)
        self.assertEqual(result["snap_id"], "test-snap-id")
        self.assertEqual(result["total_votes"], 50)
        self.assertEqual(result["ratings_band"], "good")
        # Should be called twice: first fails, then retries
        self.assertEqual(mock_stub_instance.GetRating.call_count, 2)

    @patch("webapp.ratings.ratings_client.grpc.insecure_channel")
    @patch(
        "webapp.ratings.ratings_client.ratings_features_app_pb2_grpc.AppStub"
    )
    def test_get_snap_rating_grpc_error(self, mock_app_stub, mock_channel):
        """Test snap rating fetch with gRPC error."""
        mock_channel_instance = MagicMock()
        mock_channel.return_value = mock_channel_instance

        mock_stub_instance = MagicMock()
        mock_app_stub.return_value = mock_stub_instance

        mock_error = MagicMock(spec=grpc.RpcError)
        mock_error.code = MagicMock(return_value=grpc.StatusCode.UNAVAILABLE)
        mock_error.details = MagicMock(return_value="Service unavailable")
        mock_stub_instance.GetRating.side_effect = mock_error

        client = RatingsClient(self.channel_address, use_ssl=False)
        client.token = "test-token"

        result = client.get_snap_rating("test-snap-id")

        self.assertIsNone(result)

    @patch("webapp.ratings.ratings_client.grpc.insecure_channel")
    @patch(
        "webapp.ratings.ratings_client.ratings_features_app_pb2_grpc.AppStub"
    )
    def test_get_snap_rating_unexpected_error(
        self, mock_app_stub, mock_channel
    ):
        """Test snap rating fetch with unexpected error."""
        mock_channel_instance = MagicMock()
        mock_channel.return_value = mock_channel_instance

        mock_stub_instance = MagicMock()
        mock_app_stub.return_value = mock_stub_instance
        mock_stub_instance.GetRating.side_effect = Exception(
            "Unexpected error"
        )

        client = RatingsClient(self.channel_address, use_ssl=False)
        client.token = "test-token"

        result = client.get_snap_rating("test-snap-id")

        self.assertIsNone(result)

    @patch("webapp.ratings.ratings_client.grpc.insecure_channel")
    def test_close_channel(self, mock_channel):
        """Test closing the gRPC channel."""
        mock_channel_instance = MagicMock()
        mock_channel.return_value = mock_channel_instance

        client = RatingsClient(self.channel_address, use_ssl=False)
        client.close()

        mock_channel_instance.close.assert_called_once()

    @patch("webapp.ratings.ratings_client.grpc.insecure_channel")
    @patch(
        "webapp.ratings.ratings_client.ratings_features_app_pb2_grpc.AppStub"
    )
    def test_get_snap_rating_auto_authenticate(
        self, mock_app_stub, mock_channel
    ):
        """Test snap rating fetch auto-authenticates."""
        mock_channel_instance = MagicMock()
        mock_channel.return_value = mock_channel_instance

        mock_stub_instance = MagicMock()
        mock_app_stub.return_value = mock_stub_instance

        mock_rating = MagicMock()
        mock_rating.snap_id = "test-snap-id"
        mock_rating.total_votes = 75
        mock_rating.ratings_band = 2  # GOOD_ENOUGH

        mock_response = MagicMock()
        mock_response.rating = mock_rating
        mock_stub_instance.GetRating.return_value = mock_response

        client = RatingsClient(self.channel_address, use_ssl=False)
        # No token set initially

        ratings_band_path = (
            "webapp.ratings.ratings_client."
            "ratings_features_common_pb2.RatingsBand.Name"
        )
        with patch.object(
            client, "_authenticate", return_value="new-token"
        ) as mock_auth:
            with patch(ratings_band_path, return_value="GOOD_ENOUGH"):
                result = client.get_snap_rating("test-snap-id")

        mock_auth.assert_called_once()
        self.assertIsNotNone(result)
        self.assertEqual(result["snap_id"], "test-snap-id")
