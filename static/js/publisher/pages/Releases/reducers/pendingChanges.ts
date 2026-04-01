import type {
  PendingRelease,
  PendingReleaseItem,
  Progressive,
  ReleasesReduxState,
  Revision,
} from "../../../types/releaseTypes";
import type { RootAction } from "../actions";
import {
  CLOSE_CHANNEL,
  RELEASE_REVISION,
  UNDO_RELEASE,
  CANCEL_PENDING_RELEASES,
  SET_PROGRESSIVE_RELEASE_PERCENTAGE,
  UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE,
  PAUSE_PROGRESSIVE_RELEASE,
  RESUME_PROGRESSIVE_RELEASE,
} from "../actions/pendingChanges";

export default function pendingChanges(
  state: ReleasesReduxState["pendingChanges"] = {
    changeOrderIndex: 0,
    pendingCloses: {},
    pendingReleases: {}
  },
  action: RootAction
) {
  if (action.type === CLOSE_CHANNEL || action.type === CANCEL_PENDING_RELEASES) {
    return pendingCloses(state, action);
  }
  return pendingReleases(state, action);
}

// channels to be closed: [ "track/risk", ... ]
export function pendingCloses(
  state: ReleasesReduxState["pendingChanges"] = {
    changeOrderIndex: 0,
    pendingCloses: {},
    pendingReleases: {}
  },
  action: RootAction
): ReleasesReduxState["pendingChanges"] {
  switch (action.type) {
    case CLOSE_CHANNEL:
      const pendingCloses = state.pendingCloses;
      const alreadyExistingChannel = Object.entries(pendingCloses).find(
        ([_orderIndex, channel]) => channel === action.payload.channel
      );
      // channel is already in pendingCloses so we just return the state
      if (alreadyExistingChannel) {
        return state;
      }
      const newState = updatePendingReleasesForClosingChannel(state, action.payload.channel)
      return {
        ...newState,
        changeOrderIndex: newState.changeOrderIndex + 1,
        pendingCloses: {
          ...pendingCloses,
          [newState.changeOrderIndex]: action.payload.channel,
        },
      };
    case CANCEL_PENDING_RELEASES:
      return {
        changeOrderIndex: 0,
        pendingCloses: {},
        pendingReleases: {},
      };
    default:
      return state;
  }
}

function updatePendingReleasesForClosingChannel(
  state: ReleasesReduxState["pendingChanges"],
  channel: string
) {
  Object.values(state.pendingReleases).forEach((pendingRelease) => {
    if (pendingRelease.channels[channel]) {
      state = removePendingRelease(
        state,
        pendingRelease.channels[channel].revision,
        channel
      );
    }
  });

  return state;
}

function getPendingReleaseByRevision(
  state: ReleasesReduxState["pendingChanges"],
  revision: number
): [number, PendingRelease] | null {
  const entry = Object.entries(state.pendingReleases).find(
    ([_orderKeyStr, pendingRelValue]) => pendingRelValue.revision === revision
  );
  if (entry) {
    return [parseInt(entry[0]), entry[1]];
  }
  return null;
}

function removePendingRelease(
  state: ReleasesReduxState["pendingChanges"],
  revision: Revision,
  channel: string
) {
  const newState = structuredClone(state);
  const pendingReleaseEntry = getPendingReleaseByRevision(newState, revision.revision);

  if (pendingReleaseEntry) {
    const [ orderKey, pendingRelease ] = pendingReleaseEntry;
    if (pendingRelease.channels[channel]) {
      delete pendingRelease.channels[channel];
    }
    if (Object.keys(pendingRelease.channels).length === 0) {
      delete newState.pendingReleases[orderKey];
    }
  }

  return newState;
}

function releaseRevision(
  state: ReleasesReduxState["pendingChanges"],
  revision: Revision,
  channel: string,
  progressive?: PendingReleaseItem["progressive"],
  previousReleases?: PendingReleaseItem["previousReleases"]
) {
  state = { ...state };

  // In the past it was possible to create a revision targeted for multiple
  // architectures, so we have to keep it for backwards compatibility.
  // Cancel any other pending release for the same channel in same architectures
  // if it's a different revision.
  revision.architectures.forEach((arch) => {
    Object.values(state.pendingReleases).forEach((pendingRelease) => {
      if (
        pendingRelease.revision !== revision.revision &&
        pendingRelease.channels[channel] &&
        pendingRelease.channels[channel].revision.architectures.includes(arch)
      ) {
        state = removePendingRelease(
          state,
          pendingRelease.channels[channel].revision,
          channel
        );
      }
    });
  });

  const pendingReleaseEntry = getPendingReleaseByRevision(state, revision.revision);
  let releaseOrder: number;
  let pendingRelease: PendingRelease;
  let newChangeOrderIndex = state.changeOrderIndex;
  if (!pendingReleaseEntry) {
    releaseOrder = state.changeOrderIndex;
    pendingRelease = {
      revision: revision.revision,
      channels: {}
    };
    newChangeOrderIndex = state.changeOrderIndex + 1;
  } else {
    [releaseOrder, pendingRelease] = pendingReleaseEntry;
  }

  if (!pendingRelease.channels[channel]) {
    pendingRelease.channels[channel] = {
      revision,
      channel,
    } as PendingReleaseItem;
  }
  if (previousReleases) {
    pendingRelease.channels[channel].previousReleases = previousReleases;
  }
  if (progressive && !pendingRelease.channels[channel].progressive) {
    pendingRelease.channels[channel].progressive = progressive;
  }

  return {
    ...state,
    changeOrderIndex: newChangeOrderIndex,
    pendingReleases: {
      ...state.pendingReleases,
      [releaseOrder]: pendingRelease
    }
  };
}

function setProgressiveRelease(
  state: ReleasesReduxState["pendingChanges"],
  progressive: Progressive
) {
  const nextPendingReleasesState = structuredClone(state.pendingReleases);

  Object.values(nextPendingReleasesState).forEach((pendingRelease) => {
    Object.values(pendingRelease.channels).forEach((channel) => {
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

  return {
    ...state,
    pendingReleases: nextPendingReleasesState
  };
}

function updateProgressiveRelease(
  state: ReleasesReduxState["pendingChanges"],
  progressive: Progressive
) {
  const nextPendingReleasesState = structuredClone(state.pendingReleases);

  Object.values(nextPendingReleasesState).forEach((pendingRelease) => {
    Object.values(pendingRelease.channels).forEach((channel) => {
      if (channel.progressive) {
        channel.progressive.percentage = progressive.percentage;
      }
    });
  });

  return {
    ...state,
    pendingReleases: nextPendingReleasesState
  };
}

function pauseProgressiveRelease(state: ReleasesReduxState["pendingChanges"]) {
  const nextPendingReleasesState = structuredClone(state.pendingReleases);

  Object.values(nextPendingReleasesState).forEach((pendingRelease) => {
    Object.values(pendingRelease.channels).forEach((channel) => {
      if (channel.progressive) {
        channel.progressive.paused = true;
      }
    });
  });

  return {
    ...state,
    pendingReleases: nextPendingReleasesState
  };
}

function resumeProgressiveRelease(
  state: ReleasesReduxState["pendingChanges"]
) {
  const nextPendingReleasesState = structuredClone(state.pendingReleases);

  Object.values(nextPendingReleasesState).forEach((pendingRelease) => {
    Object.values(pendingRelease.channels).forEach((channel) => {
      if (channel.progressive) {
        channel.progressive.paused = false;
      }
    });
  });

  return {
    ...state,
    pendingReleases: nextPendingReleasesState
  };
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
export function pendingReleases(
  state: ReleasesReduxState["pendingChanges"] = {
    changeOrderIndex: 0,
    pendingCloses: {},
    pendingReleases: {}
  },
  action: RootAction
): ReleasesReduxState["pendingChanges"] {
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
    case SET_PROGRESSIVE_RELEASE_PERCENTAGE:
      return setProgressiveRelease(state, action.payload);
    case UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE:
      return updateProgressiveRelease(state, action.payload);
    case PAUSE_PROGRESSIVE_RELEASE:
      return pauseProgressiveRelease(state);
    case RESUME_PROGRESSIVE_RELEASE:
      return resumeProgressiveRelease(state);
    default:
      return state;
  }
}
