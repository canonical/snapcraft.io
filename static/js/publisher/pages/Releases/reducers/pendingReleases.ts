import {
  RELEASE_REVISION,
  UNDO_RELEASE,
  CANCEL_PENDING_RELEASES,
  SET_PROGRESSIVE_RELEASE_PERCENTAGE,
  UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE,
  PAUSE_PROGRESSIVE_RELEASE,
  RESUME_PROGRESSIVE_RELEASE,
  CANCEL_PROGRESSIVE_RELEASE,
} from "../actions/pendingReleases";

import { CLOSE_CHANNEL } from "../actions/pendingCloses";

import { jsonClone } from "../helpers";

function removePendingRelease(
  state: any,
  revision: { revision: string | number },
  channel: string | number,
) {
  const newState = jsonClone(state);
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
  state: any,
  revision: { architectures: any[]; revision: number },
  channel: string,
  progressive: null,
  previousReleases: undefined,
) {
  state = { ...state };

  // cancel any other pending release for the same channel in same architectures
  // if it's a different revision
  revision.architectures.forEach((arch) => {
    Object.keys(state).forEach((revId) => {
      const pendingRelease = state[revId];

      if (
        parseInt(revId) !== revision.revision &&
        pendingRelease[channel] &&
        pendingRelease[channel].revision.architectures.includes(arch)
      ) {
        state = removePendingRelease(
          state,
          pendingRelease[channel].revision,
          channel,
        );
      }
    });
  });

  if (!state[revision.revision]) {
    state[revision.revision] = {};
  }

  if (!state[revision.revision][channel]) {
    state[revision.revision][channel] = {
      revision,
      channel,
    };
  }

  if (previousReleases) {
    state[revision.revision][channel].previousReleases = previousReleases;
  }

  if (progressive && !state[revision.revision][channel].progressive) {
    state[revision.revision][channel].progressive = progressive;
  }

  return state;
}

function closeChannel(
  state: { [s: string]: unknown } | ArrayLike<unknown>,
  channel: string | number,
) {
  Object.values(state).forEach((pendingRelease: any) => {
    if (pendingRelease[channel]) {
      state = removePendingRelease(
        state,
        pendingRelease[channel].revision,
        channel,
      );
    }
  });

  return state;
}

function setProgressiveRelease(
  state: any,
  progressive: { percentage: number },
) {
  const nextState = jsonClone(state);

  Object.values(nextState).forEach((pendingRelease: any) => {
    Object.values(pendingRelease).forEach((channel: any) => {
      const hasPreviousReleases =
        channel.previousReleases &&
        Object.keys(channel.previousReleases).length > 0;

      if (
        hasPreviousReleases &&
        !channel.progressive &&
        progressive.percentage < 100
      ) {
        channel.progressive = { paused: false, ...progressive };
      }
    });
  });

  return nextState;
}

function updateProgressiveRelease(
  state: any,
  progressive: { percentage: any },
) {
  const nextState = jsonClone(state);

  Object.values(nextState).forEach((pendingRelease: any) => {
    Object.values(pendingRelease).forEach((channel: any) => {
      if (channel.progressive) {
        channel.progressive.percentage = progressive.percentage;
      }
    });
  });

  return nextState;
}

function pauseProgressiveRelease(state: any) {
  const nextState = jsonClone(state);

  Object.values(nextState).forEach((pendingRelease: any) => {
    Object.values(pendingRelease).forEach((channel: any) => {
      if (channel.progressive) {
        channel.progressive.paused = true;
      }
    });
  });

  return nextState;
}

function resumeProgressiveRelease(state: any) {
  const nextState = jsonClone(state);

  Object.values(nextState).forEach((pendingRelease: any) => {
    Object.values(pendingRelease).forEach((channel: any) => {
      if (channel.progressive) {
        channel.progressive.paused = false;
      }
    });
  });

  return nextState;
}

// This only works on the channel/arch the cancel button is pressed on
// because we're using the previousRevision from that specific combo.
// That means the progressive.key is ignored and other releases with the
// same key are not affected.
function cancelProgressiveRelease(
  state: any,
  previousRevision: { revision: any; architectures?: any[] },
) {
  let nextState = jsonClone(state);

  Object.keys(nextState).forEach((revision) => {
    const pendingReleaseChannels = nextState[revision];
    Object.keys(pendingReleaseChannels).forEach((channel) => {
      const pendingRelease = pendingReleaseChannels[channel];

      if (pendingRelease.progressive) {
        // @ts-ignore
        nextState = releaseRevision(state, previousRevision, channel, null);
        nextState[previousRevision.revision][channel].replaces = pendingRelease;
      }
    });
  });

  return nextState;
}

// revisions to be released:
// key is the id of revision to release
// value is object containing release object and channels to release to
// {
//   <revisionId>: {
//     <channel>: {
//       revision: { revision: <revisionId>, version, ... },
//       channel: <channel>,
//       progressive: { key, percentage, paused },
//       previousReleases: {
//         <arch>: { revision: <revisionId>, version, ... }
//       },
//       replaces: <revision>
//     }
//   }
// }
// TODO: remove `revision` from here, use only data from `revisions` state
// to prevent duplication of revison data
export default function pendingReleases(
  state = {},
  action: { type?: any; payload?: any },
) {
  switch (action.type) {
    case RELEASE_REVISION:
      return releaseRevision(
        state,
        action.payload.revision,
        action.payload.channel,
        action.payload.progressive,
        action.payload.previousReleases,
      );
    case UNDO_RELEASE:
      return removePendingRelease(
        state,
        action.payload.revision,
        action.payload.channel,
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
      return pauseProgressiveRelease(state);
    case RESUME_PROGRESSIVE_RELEASE:
      return resumeProgressiveRelease(state);
    case CANCEL_PROGRESSIVE_RELEASE:
      return cancelProgressiveRelease(state, action.payload.previousRevision);
    default:
      return state;
  }
}
