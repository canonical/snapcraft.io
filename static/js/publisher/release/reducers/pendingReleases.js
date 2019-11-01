import {
  RELEASE_REVISION,
  UNDO_RELEASE,
  CANCEL_PENDING_RELEASES,
  SET_PROGRESSIVE_RELEASE_PERCENTAGE,
  UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE,
  PAUSE_PROGRESSIVE_RELEASE,
  RESUME_PROGRESSIVE_RELEASE
} from "../actions/pendingReleases";

import { CLOSE_CHANNEL } from "../actions/pendingCloses";

function removePendingRelease(state, revision, channel) {
  const releaseKey = `${revision.revision}-${channel}`;
  if (state[releaseKey]) {
    const channels = [...state[releaseKey].channels];

    if (channels.includes(channel)) {
      state = { ...state };
      channels.splice(channels.indexOf(channel), 1);
      state[releaseKey] = {
        ...state[releaseKey],
        channels
      };
    }

    if (channels.length === 0) {
      state = { ...state };
      delete state[releaseKey];
    }
  }

  return state;
}

function releaseRevision(state, revision, channel, progressive) {
  state = { ...state };

  // cancel any other pending release for the same channel in same architectures
  revision.architectures.forEach(arch => {
    Object.keys(state).forEach(releaseKey => {
      const pendingRelease = state[releaseKey];

      if (
        pendingRelease.channels.includes(channel) &&
        pendingRelease.revision.architectures.includes(arch)
      ) {
        state = removePendingRelease(state, pendingRelease.revision, channel);
      }
    });
  });

  const releaseKey = `${revision.revision}-${channel}`;
  // promote revision to channel
  let channels =
    state[releaseKey] && state[releaseKey].channels
      ? [...state[releaseKey].channels, channel]
      : [channel];

  // make sure channels are unique
  channels = channels.filter((item, i, ar) => ar.indexOf(item) === i);

  state[releaseKey] = {
    revision,
    progressive: progressive,
    channels
  };

  return state;
}

function closeChannel(state, channel) {
  Object.values(state).forEach(pendingRelease => {
    if (pendingRelease.channels.includes(channel)) {
      state = removePendingRelease(state, pendingRelease.revision, channel);
    }
  });

  return state;
}

function setProgressiveRelease(state, progressive) {
  const nextState = JSON.parse(JSON.stringify(state));

  Object.values(nextState).forEach(pendingRelease => {
    if (
      pendingRelease.canBeProgressive &&
      !pendingRelease.progressive &&
      progressive.percentage < 100
    ) {
      pendingRelease.progressive = { paused: false, ...progressive };
    }
  });

  return nextState;
}

function updateProgressiveRelease(state, progressive) {
  const nextState = JSON.parse(JSON.stringify(state));

  Object.values(nextState).forEach(pendingRelease => {
    if (
      pendingRelease.progressive &&
      pendingRelease.progressive.key === progressive.key
    ) {
      if (progressive.percentage < 100) {
        pendingRelease.progressive.percentage = progressive.percentage;
      } else {
        delete pendingRelease.progressive; // At 100% we just want to do a regular release
      }
    }
  });

  return nextState;
}

function pauseProgressiveRelease(state, key) {
  const nextState = JSON.parse(JSON.stringify(state));

  Object.values(nextState).forEach(pendingRelease => {
    if (pendingRelease.progressive && pendingRelease.progressive.key === key) {
      pendingRelease.progressive.paused = true;
    }
  });

  return nextState;
}

function resumeProgressiveRelease(state, key) {
  const nextState = JSON.parse(JSON.stringify(state));

  Object.values(nextState).forEach(pendingRelease => {
    if (pendingRelease.progressive && pendingRelease.progressive.key === key) {
      pendingRelease.progressive.paused = false;
    }
  });

  return nextState;
}

// revisions to be released:
// key is the id of revision to release
// value is object containing release object and channels to release to
// {
//  <revisionId>: {
//    revision: { revision: <revisionId>, version, ... },
//    channels: [ ... ]
//  }
// }
// TODO: remove `revision` from here, use only data from `revisions` state
// to prevent duplication of revison data
export default function pendingReleases(state = {}, action) {
  switch (action.type) {
    case RELEASE_REVISION:
      return releaseRevision(
        state,
        action.payload.revision,
        action.payload.channel,
        action.payload.progressive
      );
    case UNDO_RELEASE:
      return removePendingRelease(
        state,
        action.payload.revision,
        action.payload.channel
      );
    case CANCEL_PENDING_RELEASES:
      return {};
    case CLOSE_CHANNEL:
      return closeChannel(state, action.payload.channel);
    case SET_PROGRESSIVE_RELEASE_PERCENTAGE:
      return setProgressiveRelease(state, action.payload);
    case UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE:
      return updateProgressiveRelease(state, action.payload);
    case PAUSE_PROGRESSIVE_RELEASE:
      return pauseProgressiveRelease(state, action.payload);
    case RESUME_PROGRESSIVE_RELEASE:
      return resumeProgressiveRelease(state, action.payload);
    default:
      return state;
  }
}
