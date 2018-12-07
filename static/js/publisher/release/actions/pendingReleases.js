export const RELEASE_REVISION = "RELEASE_REVISION";
export const UNDO_RELEASE = "UNDO_RELEASE";
export const CANCEL_PENDING_RELEASES = "CANCEL_PENDING_RELEASES";

export function releaseRevision(revision, channel) {
  return {
    type: RELEASE_REVISION,
    payload: { revision, channel }
  };
}

import { getPendingChannelMap } from "../selectors";

export function promoteRevision(revision, channel) {
  return (dispatch, getState) => {
    const pendingChannelMap = getPendingChannelMap(getState());

    // compare given revision with released revisions in this arch and channel
    const isAlreadyReleased = revision.architectures.every(arch => {
      const releasedRevision =
        pendingChannelMap[channel] && pendingChannelMap[channel][arch];

      return (
        releasedRevision && releasedRevision.revision === revision.revision
      );
    });

    if (!isAlreadyReleased) {
      dispatch(releaseRevision(revision, channel));
    }
  };
}

export function undoRelease(revision, channel) {
  return {
    type: UNDO_RELEASE,
    payload: { revision, channel }
  };
}

export function cancelPendingReleases() {
  return {
    type: CANCEL_PENDING_RELEASES
  };
}
