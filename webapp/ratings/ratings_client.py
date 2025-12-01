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

USER_ID = sha256(b"snapcraft.io").hexdigest()


class RatingsClient:
    def __init__(self, channel_address: str, use_ssl: bool = True):
        self.channel_address = channel_address
        self.use_ssl = use_ssl
        self.token = None

    def _authenticate(self) -> Optional[str]:
        if self.use_ssl:
            creds = grpc.ssl_channel_credentials()
            channel = grpc.secure_channel(self.channel_address, creds)
        else:
            channel = grpc.insecure_channel(self.channel_address)

        try:
            stub = ratings_features_user_pb2_grpc.UserStub(channel)
            auth_request = ratings_features_user_pb2.AuthenticateRequest(
                id=USER_ID
            )
            auth_response = stub.Authenticate(auth_request)
            token = auth_response.token

            if not token:
                logger.error("Authentication failed: Did not receive a token.")
                return None

            logger.info("Successfully authenticated with ratings service.")
            return token
        except grpc.RpcError as e:
            logger.error(
                f"gRPC error during authentication: {e.code()} - {e.details()}"
            )
            return None
        except Exception:
            logger.exception("Unexpected error during authentication")
            return None
        finally:
            channel.close()

    def get_snap_rating(self, snap_id: str) -> Optional[Dict[str, Any]]:
        if not self.token:
            self.token = self._authenticate()
            if not self.token:
                logger.error("Failed to authenticate with ratings service")
                return None

        if self.use_ssl:
            creds = grpc.ssl_channel_credentials()
            channel = grpc.secure_channel(self.channel_address, creds)
        else:
            channel = grpc.insecure_channel(self.channel_address)

        try:
            stub = ratings_features_app_pb2_grpc.AppStub(channel)
            metadata = [("authorization", f"Bearer {self.token}")]

            request = ratings_features_app_pb2.GetRatingRequest(
                snap_id=snap_id
            )
            response = stub.GetRating(request, metadata=metadata)

            rating = response.rating

            ratings_band_name = ratings_features_common_pb2.RatingsBand.Name(
                rating.ratings_band
            )

            return {
                "snap_id": rating.snap_id,
                "total_votes": rating.total_votes,
                "ratings_band": ratings_band_name.lower().replace("_", "-"),
            }
        except grpc.RpcError as e:
            logger.warning(
                f"gRPC error fetching rating for snap {snap_id}: "
                f"{e.code()} - {e.details()}"
            )
            return None
        except Exception:
            logger.exception(
                f"Unexpected error fetching rating for snap {snap_id}"
            )
            return None
        finally:
            channel.close()
