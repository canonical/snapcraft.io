import grpc
from typing import Optional, Dict, Any
import logging
from hashlib import sha256

from webapp.ratings.generated import (
    ratings_features_app_pb2_grpc,
    ratings_features_app_pb2,
    ratings_features_user_pb2_grpc,
    ratings_features_user_pb2,
    ratings_features_common_pb2,
)

logger = logging.getLogger(__name__)

# NOTE:
# This is an intentionally static, service-level identifier used when
# authenticating this snapcraft.io frontend with the ratings service.
USER_ID = sha256(b"snapcraft.io").hexdigest()


class RatingsClient:
    def __init__(
        self, channel_address: str, use_ssl: bool = True, timeout: float = 10.0
    ):
        if not channel_address:
            raise ValueError("channel_address cannot be empty")

        self.channel_address = channel_address
        self.use_ssl = use_ssl
        self.timeout = timeout
        self.token = None
        self._channel = None

        try:
            if self.use_ssl:
                creds = grpc.ssl_channel_credentials()
                self._channel = grpc.secure_channel(
                    self.channel_address, creds
                )
                logger.info("Created secure gRPC channel to ratings service")
            else:
                logger.warning(
                    "Creating insecure gRPC channel - use_ssl=False"
                )
                self._channel = grpc.insecure_channel(self.channel_address)
        except Exception as e:
            logger.error(f"Failed to create gRPC channel: {e}")
            raise

    @property
    def channel(self):
        """Get the gRPC channel, ensuring it's not closed."""
        if self._channel is None:
            raise RuntimeError("Channel is closed or not initialized")
        return self._channel

    def _authenticate(self) -> Optional[str]:
        """Authenticate with the ratings service and return token."""
        try:
            stub = ratings_features_user_pb2_grpc.UserStub(self.channel)
            auth_request = ratings_features_user_pb2.AuthenticateRequest(
                id=USER_ID
            )
            auth_response = stub.Authenticate(
                auth_request, timeout=self.timeout
            )
            token = auth_response.token

            if not token:
                logger.error("Authentication failed: Did not receive a token.")
                return None

            logger.info("Successfully authenticated with ratings service.")
            return token
        except grpc.RpcError as e:
            logger.error(
                f"gRPC error during authentication: {e.code()} - "
                f"{e.details()}"
            )
            return None
        except RuntimeError as e:
            logger.error(f"Channel error during authentication: {e}")
            return None
        except Exception:
            logger.exception("Unexpected error during authentication")
            return None

    def get_snap_rating(
        self, snap_id: str, _retry: bool = True
    ) -> Optional[Dict[str, Any]]:
        """Get rating for a snap"""
        if not snap_id:
            logger.error("snap_id cannot be empty")
            return None

        if not self.token:
            self.token = self._authenticate()
            if not self.token:
                logger.error("Failed to authenticate with ratings service")
                return None

        try:
            stub = ratings_features_app_pb2_grpc.AppStub(self.channel)
            metadata = [("authorization", f"Bearer {self.token}")]

            request = ratings_features_app_pb2.GetRatingRequest(
                snap_id=snap_id
            )
            response = stub.GetRating(
                request, metadata=metadata, timeout=self.timeout
            )

            rating = response.rating

            ratings_band_name = ratings_features_common_pb2.RatingsBand.Name(
                rating.ratings_band
            )
            logger.debug("Fetched rating for snap %s: %s", snap_id, rating)

            return {
                "snap_id": rating.snap_id,
                "total_votes": rating.total_votes,
                "ratings_band": ratings_band_name.lower().replace("_", "-"),
            }
        except grpc.RpcError as e:
            # If authentication failed, refresh token and retry once
            if e.code() == grpc.StatusCode.UNAUTHENTICATED and _retry:
                logger.info(
                    f"Token expired for snap {snap_id}, "
                    "re-authenticating and retrying"
                )
                self.token = self._authenticate()
                if self.token:
                    return self.get_snap_rating(snap_id, _retry=False)

            logger.warning(
                f"gRPC error fetching rating for snap {snap_id}: "
                f"{e.code()} - {e.details()}"
            )
            return None
        except RuntimeError as e:
            logger.error(
                f"Channel error fetching rating for snap {snap_id}: {e}"
            )
            return None
        except Exception:
            logger.exception(
                f"Unexpected error fetching rating for snap {snap_id}"
            )
            return None

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - ensures channel is closed."""
        self.close()
        return False

    def close(self):
        """Close the gRPC channel."""
        if self._channel is not None:
            try:
                self._channel.close()
                logger.info("Closed ratings service gRPC channel")
            except Exception as e:
                logger.error(f"Error closing gRPC channel: {e}")
            finally:
                self._channel = None
