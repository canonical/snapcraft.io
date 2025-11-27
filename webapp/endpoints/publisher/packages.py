# Packages
import flask
from canonicalwebteam.store_api.publishergw import PublisherGW
from canonicalwebteam.exceptions import (
    StoreApiError,
    StoreApiResponseErrorList,
    StoreApiResponseError,
    StoreApiResourceNotFound,
)
from flask.json import jsonify

# Local
from webapp.helpers import api_publisher_session
from webapp.decorators import exchange_required, login_required
from cache.cache_utility import redis_cache

publisher_gateway = PublisherGW("snap", api_publisher_session)


@login_required
@exchange_required
def get_package_metadata(snap_name):
    package_metadata_key = f"package_metadata:{snap_name}"
    package_metadata = redis_cache.get(
        package_metadata_key, expected_type=dict
    )

    if package_metadata:
        return jsonify({"data": package_metadata, "success": True})

    try:
        package_metadata = publisher_gateway.get_package_metadata(
            flask.session, snap_name
        )
        redis_cache.set(package_metadata_key, package_metadata, ttl=3600)
        return jsonify({"data": package_metadata, "success": True})
    except StoreApiResourceNotFound:
        return (jsonify({"error": "Package not found", "success": False}), 404)
    except StoreApiResponseErrorList as error:
        return (
            jsonify(
                {
                    "error": "Error occurred while fetching snap metadata.",
                    "errors": error.errors,
                    "success": False,
                }
            ),
            error.status_code,
        )
    except StoreApiResponseError as error:
        return (
            jsonify(
                {
                    "error": "Error occurred while fetching snap metadata.",
                    "success": False,
                }
            ),
            error.status_code,
        )
    except StoreApiError:
        return (
            jsonify(
                {
                    "error": "Error occurred while fetching snap metadata.",
                    "success": False,
                }
            ),
            500,
        )
    except Exception:
        return (jsonify({"error": "Unexpected error", "success": False}), 500)
