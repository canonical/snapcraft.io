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
  const newState = { ...state };
  if (newState[revision.revision]) {
    if (newState[revision.revision][channel]) {
      delete newState[revision.revision][channel];
    }

    if (Object.keys(newState[revision.revision]).length === 0) {
      delete newState[revision.revision];
    }
  }

  return newState;
}

function releaseRevision(
  state,
  revision,
  channel,
  progressive,
  canBeProgressive
) {
  state = { ...state };

  // cancel any other pending release for the same channel in same architectures
  revision.architectures.forEach(arch => {
    Object.keys(state).forEach(revId => {
      const pendingRelease = state[revId];

      if (
        pendingRelease[channel] &&
        pendingRelease[channel].revision.architectures.includes(arch)
      ) {
        state = removePendingRelease(
          state,
          pendingRelease[channel].revision,
          channel
        );
      }
    });
  });

  if (!state[revision.revision]) {
    state[revision.revision] = {};
  }

  state[revision.revision][channel] = {
    revision,
    channel
  };

  if (canBeProgressive) {
    state[revision.revision][channel].canBeProgressive = true;
  }

  if (progressive) {
    state[revision.revision][channel].progressive = progressive;
  }

  return state;
}

function closeChannel(state, channel) {
  Object.values(state).forEach(pendingRelease => {
    if (pendingRelease[channel]) {
      state = removePendingRelease(
        state,
        pendingRelease[channel].revision,
        channel
      );
    }
  });

  return state;
}

function setProgressiveRelease(state, progressive) {
  const nextState = JSON.parse(JSON.stringify(state));

  Object.values(nextState).forEach(pendingRelease => {
    Object.values(pendingRelease).forEach(channel => {
      if (
        channel.canBeProgressive &&
        !channel.progressive &&
        progressive.percentage < 100
      ) {
        channel.progressive = { paused: false, ...progressive };
      }
    });
  });

  return nextState;
}

function updateProgressiveRelease(state, progressive) {
  const nextState = JSON.parse(JSON.stringify(state));

  Object.values(nextState).forEach(pendingRelease => {
    Object.values(pendingRelease).forEach(channel => {
      if (channel.progressive && channel.progressive.key === progressive.key) {
        if (progressive.percentage < 100) {
          channel.progressive.percentage = progressive.percentage;
        } else {
          delete channel.progressive; // At 100% we just want to do a regular release
        }
      }
    });
  });

  return nextState;
}

function pauseProgressiveRelease(state, key) {
  const nextState = JSON.parse(JSON.stringify(state));

  Object.values(nextState).forEach(pendingRelease => {
    Object.values(pendingRelease).forEach(channel => {
      if (channel.progressive && channel.progressive.key === key) {
        channel.progressive.paused = true;
      }
    });
  });

  return nextState;
}

function resumeProgressiveRelease(state, key) {
  const nextState = JSON.parse(JSON.stringify(state));

  Object.values(nextState).forEach(pendingRelease => {
    Object.values(pendingRelease).forEach(channel => {
      if (channel.progressive && channel.progressive.key === key) {
        channel.progressive.paused = false;
      }
    });
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
        action.payload.progressive,
        action.payload.canBeProgressive
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
