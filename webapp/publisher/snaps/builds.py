from enum import Enum


class StoreFrontBuildState(Enum):
    NEVER_BUILT = "never_built"
    BUILDING_SOON = "building_soon"
    WONT_RELEASE = "wont_release"
    RELEASED = "released"
    RELEASE_FAILED = "release_failed"
    RELEASING_SOON = "releasing_soon"
    IN_PROGRESS = "in_progress"
    FAILED_TO_BUILD = "failed_to_build"
    UNKNOWN = "unknown"


class LaunchpadBuildState(Enum):
    NEEDS_BUILD = "Needs building"
    FULLY_BUILT = "Successfully built"
    FAILED_BUILD = "Failed to build"
    MANUALDEPWAIT = "Dependency wait"
    CHROOTWAIT = "Chroot problem"
    SUPERSEDED = "Build for superseded Source"
    BUILDING = "Currently building"
    FAILED_UPLOAD = "Failed to upload"
    UPLOADING = "Uploading build"
    CANCELLING = "Cancelling build"
    CANCELLED = "Cancelled build"


class LaunchpadStoreUploadState(Enum):
    UNSCHEDULED = "Unscheduled"
    PENDING = "Pending"
    FAILED_UPLOAD = "Failed to upload"
    FAILED_RELEASE = "Failed to release to channels"
    UPLOADED = "Uploaded"


def build_link(bsi_url, snap, build):
    """ Builds the link to the build page
    """
    build_id = build["self_link"].split("/")[-1]

    # Remove GitHub hostname & split owner/repo
    owner, repo = snap["git_repository_url"][19:].split("/")

    return f"{bsi_url}/user/{owner}/{repo}/{build_id}"


def _map_upload_state(upload_state):
    """ Returns a user facing status based on
        the status of the snap's upload to the store.
    """
    upload_state = LaunchpadStoreUploadState(upload_state)
    if upload_state == LaunchpadStoreUploadState.UNSCHEDULED:
        return StoreFrontBuildState.WONT_RELEASE.value

    elif upload_state == LaunchpadStoreUploadState.PENDING:
        return StoreFrontBuildState.RELEASING_SOON.value

    elif (
        upload_state == LaunchpadStoreUploadState.FAILED_UPLOAD
        or upload_state == LaunchpadStoreUploadState.FAILED_RELEASE
    ):
        return StoreFrontBuildState.RELEASE_FAILED.value

    elif upload_state == LaunchpadStoreUploadState.UPLOADED:
        return StoreFrontBuildState.RELEASED.value

    return StoreFrontBuildState.UNKNOWN.value


def map_build_and_upload_states(build_state, upload_state):
    """ Returns a user facing status based on the LP
        build state and the status of the snap's
        upload to the store.
    """
    build_state = LaunchpadBuildState(build_state)

    if build_state == LaunchpadBuildState.NEEDS_BUILD:
        return StoreFrontBuildState.BUILDING_SOON.value

    elif build_state == LaunchpadBuildState.FULLY_BUILT:
        return _map_upload_state(upload_state)

    elif build_state == LaunchpadBuildState.BUILDING:
        return StoreFrontBuildState.IN_PROGRESS.value

    elif build_state == LaunchpadBuildState.UPLOADING:
        return StoreFrontBuildState.IN_PROGRESS.value

    elif (
        build_state == LaunchpadBuildState.FAILED_BUILD
        or LaunchpadBuildState.MANUALDEPWAIT
        or LaunchpadBuildState.CHROOTWAIT
        or LaunchpadBuildState.SUPERSEDED
        or LaunchpadBuildState.FAILED_UPLOAD
        or LaunchpadBuildState.CANCELLING
        or LaunchpadBuildState.CANCELLED
    ):
        return StoreFrontBuildState.FAILED_TO_BUILD.value

    return StoreFrontBuildState.UNKNOWN.value
