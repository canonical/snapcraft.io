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
import {
  PendingReleaseItem,
  Progressive,
  ReleasesAction,
  ReleasesReduxState,
  Revision,
} from "../../../types/releaseTypes";

function removePendingRelease(
  state: ReleasesReduxState["pendingReleases"],
  revision: Revision,
  channel: string
) {
  const newState = structuredClone(state);
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
  state: ReleasesReduxState["pendingReleases"],
  revision: Revision,
  channel: string,
  progressive?: PendingReleaseItem["progressive"],
  previousReleases?: PendingReleaseItem["previousReleases"]
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
          channel
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
    } as PendingReleaseItem;
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
  state: ReleasesReduxState["pendingReleases"],
  channel: string
) {
  Object.values(state).forEach((pendingRelease) => {
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

function setProgressiveRelease(
  state: ReleasesReduxState["pendingReleases"],
  progressive: Progressive
) {
  const nextState = structuredClone(state);

  Object.values(nextState).forEach((pendingRelease) => {
    Object.values(pendingRelease).forEach((channel) => {
      const hasPreviousReleases =
        channel.previousReleases &&
        Object.keys(channel.previousReleases).length > 0;

      if (
        hasPreviousReleases &&
        !channel.progressive &&
        progressive.percentage &&
        progressive.percentage < 100
      ) {
        channel.progressive = { ...progressive };
        if (!channel.progressive?.paused) channel.progressive.paused = false;
      }
    });
  });

  return nextState;
}

function updateProgressiveRelease(
  state: ReleasesReduxState["pendingReleases"],
  progressive: Progressive
) {
  const nextState = structuredClone(state);

  Object.values(nextState).forEach((pendingRelease) => {
    Object.values(pendingRelease).forEach((channel) => {
      if (channel.progressive) {
        channel.progressive.percentage = progressive.percentage;
      }
    });
  });

  return nextState;
}

function pauseProgressiveRelease(state: ReleasesReduxState["pendingReleases"]) {
  const nextState = structuredClone(state);

  Object.values(nextState).forEach((pendingRelease) => {
    Object.values(pendingRelease).forEach((channel) => {
      if (channel.progressive) {
        channel.progressive.paused = true;
      }
    });
  });

  return nextState;
}

function resumeProgressiveRelease(
  state: ReleasesReduxState["pendingReleases"]
) {
  const nextState = structuredClone(state);

  Object.values(nextState).forEach((pendingRelease) => {
    Object.values(pendingRelease).forEach((channel) => {
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
  state: ReleasesReduxState["pendingReleases"],
  previousRevision: Revision
) {
  let nextState = structuredClone(state);

  Object.keys(nextState).forEach((revision) => {
    const pendingReleaseChannels = nextState[revision];
    Object.keys(pendingReleaseChannels).forEach((channel) => {
      const pendingRelease = pendingReleaseChannels[channel];

      if (pendingRelease.progressive) {
        nextState = releaseRevision(state, previousRevision, channel);
        nextState[previousRevision.revision][channel].replaces = pendingRelease;
      }
    });
  });

  return nextState;
}

type PendingReleasesAction = ReleasesAction &
  (
    | {
        type: typeof RELEASE_REVISION;
        payload: {
          revision: Revision;
          channel: string;
          progressive?: PendingReleaseItem["progressive"];
          previousReleases?: PendingReleaseItem["previousReleases"];
        };
      }
    | {
        type: typeof UNDO_RELEASE;
        payload: {
          revision: Revision;
          channel: string;
        };
      }
    | {
        type: typeof CANCEL_PENDING_RELEASES;
        payload: never;
      }
    | {
        type: typeof CLOSE_CHANNEL;
        payload: { channel: string };
      }
    | {
        type: typeof SET_PROGRESSIVE_RELEASE_PERCENTAGE;
        payload: Progressive;
      }
    | {
        type: typeof UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE;
        payload: Progressive;
      }
    | {
        type: typeof PAUSE_PROGRESSIVE_RELEASE;
        payload: never;
      }
    | {
        type: typeof RESUME_PROGRESSIVE_RELEASE;
        payload: never;
      }
    | {
        type: typeof CANCEL_PROGRESSIVE_RELEASE;
        payload: { previousRevision: Revision };
      }
  );

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
  state: ReleasesReduxState["pendingReleases"] = {},
  action: PendingReleasesAction
) {
  switch (action.type) {
    case RELEASE_REVISION:
      return releaseRevision(
        state,
        action.payload.revision,
        action.payload.channel,
        action.payload.progressive,
        action.payload.previousReleases
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
      return pauseProgressiveRelease(state);
    case RESUME_PROGRESSIVE_RELEASE:
      return resumeProgressiveRelease(state);
    case CANCEL_PROGRESSIVE_RELEASE:
      return cancelProgressiveRelease(state, action.payload.previousRevision);
    default:
      return state;
  }
}
