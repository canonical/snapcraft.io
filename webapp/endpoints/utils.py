def get_snap_info_cache_key(snap_name):
    """
    Generate a cache key for snap info data.

    Args:
        snap_name: The name of the snap

    Returns:
        str: Cache key in format "snap_info:{snap_name}"
    """
    return f"snap_info:{snap_name}"
