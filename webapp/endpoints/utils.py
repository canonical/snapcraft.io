from cache.cache_utility import redis_cache
import flask


def get_snap_info_cache_key(snap_name, snap_owner=None):
    """
    Generate a cache key for snap info data.

    Args:
        snap_name: The name of the snap

    Returns:
        str: Cache key in format "snap_info:{snap_name}"
    """
    return f"snap_info:{snap_name}{':'+snap_owner if snap_owner else ''}"


def get_release_history_key(snap_name, snap_owner=None):
    """Return a cache key for release history.

    If snap_owner is provided the key becomes:
    "release_history:{snap_name}:{snap_owner}".
    """
    return f"release_history:{snap_name}{':'+snap_owner if snap_owner else ''}"


def get_item_details_cache_key(snap_name):
    return f"get_item_details:{snap_name}"


def get_cached_snap_info(snap_name):
    public_key = get_snap_info_cache_key(snap_name)
    data = redis_cache.get(public_key, expected_type=dict)
    if data:
        return data
    owner = flask.session.get("publisher", {}).get("nickname")
    private_key = get_snap_info_cache_key(snap_name, snap_owner=owner)
    data = redis_cache.get(private_key, expected_type=dict)
    return data


def set_cached_snap_info(snap_name, snap_details, ttl=3600):
    owner = flask.session.get("publisher", {}).get("nickname")

    if snap_details.get("private") and owner == snap_details.get(
        "publisher", {}
    ).get("username"):
        private_key = get_snap_info_cache_key(snap_name, snap_owner=owner)
        redis_cache.set(private_key, snap_details, ttl=ttl)
    else:
        public_key = get_snap_info_cache_key(snap_name)
        redis_cache.set(public_key, snap_details, ttl=ttl)


def invalidate_snap_info_cache(snap_name):
    redis_cache.delete(get_snap_info_cache_key(snap_name))
    owner = flask.session.get("publisher", {}).get("nickname")
    redis_cache.delete(get_snap_info_cache_key(snap_name, snap_owner=owner))


def get_cached_release_history(snap_name):
    owner = flask.session.get("publisher", {}).get("nickname")
    if owner:
        owner_key = get_release_history_key(snap_name, snap_owner=owner)
        data = redis_cache.get(owner_key, expected_type=dict)
        if data:
            return data

    public_key = get_release_history_key(snap_name)
    return redis_cache.get(public_key, expected_type=dict)


def set_cached_release_history(snap_name, snap, context, ttl=600):
    owner = flask.session.get("publisher", {}).get("nickname")
    username = snap.get("publisher", {}).get("username")
    is_private = context.get("private")
    if is_private:
        if owner == username:
            owner_key = get_release_history_key(snap_name, snap_owner=owner)
            redis_cache.set(owner_key, context, ttl=ttl)
        # Do not cache private release history for non-owners
    else:
        public_key = get_release_history_key(snap_name)
        redis_cache.set(public_key, context, ttl=ttl)


def invalidate_release_history_cache(snap_name):
    public_key = get_release_history_key(snap_name)
    redis_cache.delete(public_key)
    owner = flask.session.get("publisher", {}).get("nickname")
    redis_cache.delete(get_release_history_key(snap_name, snap_owner=owner))
