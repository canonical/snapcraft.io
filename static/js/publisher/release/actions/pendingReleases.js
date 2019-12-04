export const RELEASE_REVISION = "RELEASE_REVISION";
export const UNDO_RELEASE = "UNDO_RELEASE";
export const CANCEL_PENDING_RELEASES = "CANCEL_PENDING_RELEASES";
export const SET_PROGRESSIVE_RELEASE_PERCENTAGE =
  "SET_PROGRESSIVE_RELEASE_PERCENTAGE";
export const UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE =
  "UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE";
export const PAUSE_PROGRESSIVE_RELEASE = "PAUSE_PROGRESSIVE_RELEASE";
export const RESUME_PROGRESSIVE_RELEASE = "RESUME_PROGRESSIVE_RELEASE";
export const CANCEL_PROGRESSIVE_RELEASE = "CANCEL_PROGRESSIVE_RELEASE";

import { getPendingChannelMap, getReleases } from "../selectors";

export function releaseRevision(revision, channel, progressive) {
  return (dispatch, getState) => {
    const state = getState();
    const { revisions } = state;

    const previousRevisions = getReleases(
      state,
      revision.architectures,
      channel
    )
      .filter(release => release.revision !== revision.revision)
      .map(release => revisions[release.revision]);

    if (!progressive) {
      progressive = {
        key: null,
        percentage: 100,
        paused: false
      };
    }

    return dispatch({
      type: RELEASE_REVISION,
      payload: {
        revision,
        channel,
        progressive,
        previousRevisions
      }
    });
  };
}

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

export function pauseProgressiveRelease(key) {
  return {
    type: PAUSE_PROGRESSIVE_RELEASE,
    payload: key
  };
}

export function resumeProgressiveRelease(key) {
  return {
    type: RESUME_PROGRESSIVE_RELEASE,
    payload: key
  };
}

export function cancelProgressiveRelease(key, previousRevision) {
  return {
    type: CANCEL_PROGRESSIVE_RELEASE,
    payload: {
      key,
      previousRevision
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
      dispatch(releaseRevision(revision, channel, undefined));
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
