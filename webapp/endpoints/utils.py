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


def get_item_details_cache_key(snap_name):
    return f"get_item_details:{snap_name}"
