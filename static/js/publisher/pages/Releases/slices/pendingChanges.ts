import { createSlice, Draft, PayloadAction } from "@reduxjs/toolkit";
import { getPendingChannelMap, getReleases } from "../selectors";
import { triggerGAEvent } from "../analytics";
import type {
  PendingChangesState,
  PendingRelease,
  PendingReleaseItem,
  Progressive,
  Revision,
  Release,
} from "../../../types/releaseTypes";
import type { AppDispatch, RootState } from "../store";
import { closeHistory } from "./history";

export function releaseRevision(
  revision: Revision,
  channel: string,
  progressive?: PendingReleaseItem["progressive"]
) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const { revisions, pendingChanges } = state;
    const pendingReleases = pendingChanges.pendingReleases;

    const previousReleases = getReleases(state, revision.architectures, channel)
      // Find all revision releases for this channel and architecture
      // that do not share the same revision number as the previous release.
      // for example [1, 1, 2, 2, 3, 2, 2, 2, 1] will return [1, 2, 3, 2, 1]
      .reduce((acc: Release[], release: Release) => {
        if (!acc.length || acc[acc.length - 1].revision !== release.revision) {
          acc.push(release);
        }
        return acc;
      }, [])
      .map((release) => revisions[release.revision!]);

    let revisionToRelease = revision;
    if (!progressive && previousReleases.length > 0 && previousReleases[0]) {
      revisionToRelease = revisions[revision.revision];
      let percentage: number | null = 100;

      // If there's already a "null" release in staging that is progressive
      // assign that value to subsequent progressive releases
      Object.keys(pendingReleases).forEach((orderIndex) => {
        const numericOrderIndex = Number(orderIndex);
        const channels = pendingReleases[numericOrderIndex].channels;
        Object.keys(channels).forEach((channel) => {
          const release = channels[channel];

          if (release.progressive && percentage === 100) {
            percentage = release.progressive.percentage;
          }
        });
      });

      // Set key to null as we want to set the same key for a group
      // of releases on release. In actions/releases.js the key is either
      // updated, or the progressive object is removed completely
      progressive = {
        percentage: percentage,
      } as Progressive;
    }

    return dispatch(addPendingRelease({
      revision: revisionToRelease,
      channel,
      progressive,
      previousReleases,
    }));
  };
}

export function promoteRevision(revision: Revision, channel: string) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const pendingChannelMap = getPendingChannelMap(getState());

    const canPromoteRevision = revision.architectures.every((arch) => {
      const releasedRevision = pendingChannelMap[channel]?.[arch];

      const isNotReleased = !releasedRevision;
      const isDifferentRevision =
        releasedRevision && releasedRevision.revision !== revision.revision;

      let releasedRevisionIsProgressive = false;
      if (releasedRevision) {
        const releasedRevisionReleaseHistory = releasedRevision.releases;

        if (releasedRevisionReleaseHistory) {
          const channelReleases = releasedRevisionReleaseHistory.filter(
            (r) => r.channel === channel && r.architecture === arch,
          );
          if (channelReleases.length > 0 && channelReleases[0].isProgressive) {
            releasedRevisionIsProgressive = true;
          }
        }
      }

      return (
        isNotReleased || isDifferentRevision || releasedRevisionIsProgressive
      );
    });

    if (canPromoteRevision) {
      dispatch(releaseRevision(revision, channel, undefined));
    }
  };
}

export function promoteChannel(channel: string, targetChannel: string) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const pendingChannelMap = getPendingChannelMap(getState());
    const pendingInChannel = pendingChannelMap[channel];

    if (pendingInChannel) {
      Object.values(pendingInChannel).forEach((revision) => {
        if (revision) {
          dispatch(promoteRevision(revision, targetChannel));
        }
      });
    }
  };
}

export function undoRelease(revision: Revision, channel: string) {
  return (dispatch: AppDispatch) => {
    dispatch(
      triggerGAEvent(
        "click-cancel-promotion",
        `${channel}/${revision.architectures[0]}`,
      ),
    );
    return dispatch(removePendingRelease({
      revision,
      channel,
    }));
  };
}

export function closeChannel(channel: string) {
  return (dispatch: AppDispatch) => {
    dispatch(addPendingClose(channel));
    dispatch(closeHistory());
  };
}

function _getPendingReleaseByRevision(
  state: Draft<PendingChangesState>,
  revision: number
): Draft<[number, PendingRelease]> | null {
  const entry = Object.entries(state.pendingReleases).find(
    ([_orderKeyStr, pendingRelValue]) => pendingRelValue.revision === revision
  );
  if (entry) {
    return [parseInt(entry[0]), entry[1]];
  }
  return null;
}

function _removePendingRelease(
  state: Draft<PendingChangesState>,
  revision: Draft<Revision>,
  channel: string
) {
  const pendingReleaseEntry = _getPendingReleaseByRevision(state, revision.revision);
  if (pendingReleaseEntry) {
    const [ orderKey, pendingRelease ] = pendingReleaseEntry;
    if (pendingRelease.channels[channel]) {
      delete pendingRelease.channels[channel];
    }
    if (Object.keys(pendingRelease.channels).length === 0) {
      delete state.pendingReleases[orderKey];
    }
  }
}

/*
revisions to be released:
key is the id of revision to release
value is object containing release object and channels to release to
{
  <revisionId>: {
    <channel>: {
      revision: { revision: <revisionId>, version, ... },
      channel: <channel>,
      progressive: { changes, percentage, current-percentage },
      previousReleases: {
        <arch>: { revision: <revisionId>, version, ... }
      },
      replaces: <revision>
    }
  }
}
we should prevent duplication of revison data.
TODO: remove `revision` from here, use only data from `revisions` state
TODO: remove `revision` from the PendingReleaseItem type
*/

export type ReleaseRevisionPayload = {
  revision: Revision;
  channel: string;
  progressive?: Progressive;
  previousReleases?: PendingReleaseItem["previousReleases"];
};

export type RemoveRevisionPayload = {
  revision: Revision;
  channel: string;
}

const pendingReleasesSlice = createSlice({
  name: "pendingReleases",
  initialState: {
    changeOrderIndex: 0,
    pendingCloses: {},
    pendingReleases: {},
  } as PendingChangesState,
  reducers: {
    incrementOrderIndex(state) {
      state.changeOrderIndex += 1;
    },
    addPendingClose(state, action: PayloadAction<string>) {
      const pendingCloses = state.pendingCloses;
      const alreadyExistingChannel = Object.entries(pendingCloses).find(
        ([_orderIndex, channel]) => channel === action.payload
      );
      // channel is already in pendingCloses so we just return the state
      if (alreadyExistingChannel) {
        return;
      }

      const channel = action.payload;
      Object.values(state.pendingReleases).forEach((pendingRelease) => {
        if (pendingRelease.channels[channel]) {
          _removePendingRelease(
            state,
            pendingRelease.channels[channel].revision,
            channel
          );
        }
      });

      state.pendingCloses[state.changeOrderIndex] = channel;
      state.changeOrderIndex += 1;
    },
    cancelPendingChanges() {
      return {
        changeOrderIndex: 0,
        pendingCloses: {},
        pendingReleases: {},
      };
    },
    addPendingRelease(state, action: PayloadAction<ReleaseRevisionPayload>) {
      const revision = action.payload.revision;
      const channel = action.payload.channel;
      const progressive = action.payload.progressive;
      const previousReleases = action.payload.previousReleases;

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
            _removePendingRelease(
              state,
              pendingRelease.channels[channel].revision,
              channel
            );
          }
        });
      });

      const pendingReleaseEntry = _getPendingReleaseByRevision(state, revision.revision);
      let releaseOrder: number;
      let pendingRelease: Draft<PendingRelease>;
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

      state.changeOrderIndex = newChangeOrderIndex;
      state.pendingReleases[releaseOrder] = pendingRelease;
    },
    removePendingRelease(state, action: PayloadAction<RemoveRevisionPayload>) {
      _removePendingRelease(state, action.payload.revision, action.payload.channel);
    },
    setProgressiveRelease(state, action: PayloadAction<Progressive>) {
      const progressive = action.payload;
      Object.values(state.pendingReleases).forEach((pendingRelease) => {
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
          }
        });
      });
    },
    updateProgressiveRelease(state, action: PayloadAction<Progressive>) {
      const progressive = action.payload;
      Object.values(state.pendingReleases).forEach((pendingRelease) => {
        Object.values(pendingRelease.channels).forEach((channel) => {
          if (channel.progressive) {
            channel.progressive.percentage = progressive.percentage;
          }
        });
      });
    },
  }
});

// Don't export addPendingClose because we want the users to use the thunk CloseChannel
const { addPendingClose } = pendingReleasesSlice.actions;

export const {
  incrementOrderIndex,
  cancelPendingChanges,
  addPendingRelease,
  removePendingRelease,
  setProgressiveRelease,
  updateProgressiveRelease,
} = pendingReleasesSlice.actions;
export default pendingReleasesSlice.reducer;
