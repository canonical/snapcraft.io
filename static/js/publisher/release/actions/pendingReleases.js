export const RELEASE_REVISION = "RELEASE_REVISION";
export const UNDO_RELEASE = "UNDO_RELEASE";
export const CANCEL_PENDING_RELEASES = "CANCEL_PENDING_RELEASES";
export const SET_PROGRESSIVE_RELEASE_PERCENTAGE =
  "SET_PROGRESSIVE_RELEASE_PERCENTAGE";
export const UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE =
  "UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE";

export function releaseRevision(revision, channel, progressive) {
  return {
    type: RELEASE_REVISION,
    payload: { revision, channel, progressive }
  };
}

import { getPendingChannelMap } from "../selectors";

export function setProgressiveReleasePercentage(key, percentage) {
  return {
    type: SET_PROGRESSIVE_RELEASE_PERCENTAGE,
    payload: {
      key,
      percentage
    }
  };
}

export function updateProgressiveReleasePercentage(key, percentage) {
  return {
    type: UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE,
    payload: {
      key,
      percentage
    }
  };
}

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

export function promoteChannel(channel, targetChannel) {
  return (dispatch, getState) => {
    const pendingChannelMap = getPendingChannelMap(getState());
    const pendingInChannel = pendingChannelMap[channel];

    if (pendingInChannel) {
      Object.values(pendingInChannel).forEach(revision => {
        dispatch(promoteRevision(revision, targetChannel));
      });
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
