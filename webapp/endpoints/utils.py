def get_snap_info_cache_key(snap_name):
    """
    Generate a cache key for snap info data.

    Args:
        snap_name: The name of the snap

    Returns:
        str: Cache key in format "snap_info:{snap_name}"
    """
    return f"snap_info:{snap_name}"


def get_release_history_key(snap_name):
    return f"release_history:{snap_name}"


def get_release_history_json_key(snap_name, page):
    return (f"release_history_json:{snap_name}", {"page": page})
