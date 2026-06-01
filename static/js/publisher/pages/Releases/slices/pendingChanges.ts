import { createSlice, Draft, PayloadAction } from "@reduxjs/toolkit";
import { getPendingChannelMap, getReleases } from "../selectors";
import { triggerGAEvent } from "../analytics";
import type {
  PendingChangesState,
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
      Object.values(pendingReleases).forEach((pendingReleaseItem) => {
        if (pendingReleaseItem.progressive && percentage === 100) {
          percentage = pendingReleaseItem.progressive.percentage;
        }
      });

      // this is the exact payload expected by the Store API BE
      // do not add or remove any key
      progressive = {
        percentage: percentage,
        paused: null,
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
  revision: number,
  channel?: string
): Draft<[number, PendingReleaseItem]> | null {
  let entries = Object.entries(state.pendingReleases)
    .filter(
      ([_orderKeyStr, pendingRelItem]) => pendingRelItem.revision.revision === revision
    );
  
  if (channel) {
    entries = entries.filter(
      ([_orderKeyStr, pendingRelItem]) => pendingRelItem.channel === channel
    );
  }

  if (entries.length > 0) {
    const entry = entries[0];
    return [parseInt(entry[0]), entry[1]];
  }
  return null;
}

function _removePendingRelease(
  state: Draft<PendingChangesState>,
  revision: Draft<Revision>,
  channel: string
) {
  const pendingReleaseEntry = _getPendingReleaseByRevision(
    state,
    revision.revision,
    channel
  );
  if (pendingReleaseEntry) {
    const [ orderKey, pendingReleaseItem ] = pendingReleaseEntry;
    if (pendingReleaseItem.channel === channel) {
      delete state.pendingReleases[orderKey];
    }
  }
}

/*
TODO: We should prevent duplication of revision data.
Remove `revision` from the PendingReleaseItem type,
and use only data from `revisions` state
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
      const channel = action.payload;
      const alreadyExistingChannel = Object.entries(pendingCloses).find(
        ([_orderIndex, channel]) => channel === action.payload
      );

      if (alreadyExistingChannel) {
        const index = parseInt(alreadyExistingChannel[0]);
        delete state.pendingCloses[index];
      } else {
        Object.values(state.pendingReleases).forEach((pendingRelease) => {
          if (pendingRelease.channel === channel) {
            _removePendingRelease(
              state,
              pendingRelease.revision,
              channel
            );
          }
        });
      }

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
            pendingRelease.revision.revision !== revision.revision &&
            pendingRelease.channel === channel &&
            pendingRelease.revision.architectures.includes(arch)
          ) {
            _removePendingRelease(
              state,
              pendingRelease.revision,
              channel
            );
          }
        });
      });

      const pendingReleaseEntry = _getPendingReleaseByRevision(
        state, revision.revision, channel);
      let pendingReleaseItem: Draft<PendingReleaseItem>;
      let releaseOrder: number;
      let newChangeOrderIndex = state.changeOrderIndex;
      if (pendingReleaseEntry) {
        [releaseOrder, pendingReleaseItem] = pendingReleaseEntry;
        pendingReleaseItem.previousReleases = previousReleases ?? [];
        pendingReleaseItem.progressive = progressive;
      } else {
        releaseOrder = state.changeOrderIndex;
        pendingReleaseItem = {
          revision: revision,
          channel: channel,
          previousReleases: previousReleases ?? [],
          progressive: progressive,
        };
        newChangeOrderIndex = state.changeOrderIndex + 1;
      }

      state.pendingReleases[releaseOrder] = pendingReleaseItem;
      state.changeOrderIndex = newChangeOrderIndex;
    },
    removePendingRelease(state, action: PayloadAction<RemoveRevisionPayload>) {
      _removePendingRelease(state, action.payload.revision, action.payload.channel);
    },
    setProgressiveRelease(state, action: PayloadAction<Progressive>) {
      const progressive = action.payload;
      Object.values(state.pendingReleases).forEach((pendingReleaseItem) => {
        const hasPreviousReleases =
          pendingReleaseItem.previousReleases &&
          pendingReleaseItem.previousReleases.length > 0;
        if (
          hasPreviousReleases &&
          !pendingReleaseItem.progressive &&
          progressive.percentage &&
          progressive.percentage < 100
        ) {
          pendingReleaseItem.progressive = { ...progressive };
        }
      });
    },
    updateProgressiveRelease(state, action: PayloadAction<Progressive>) {
      const progressive = action.payload;
      Object.values(state.pendingReleases).forEach((pendingReleaseItem) => {
        if (pendingReleaseItem.progressive) {
          pendingReleaseItem.progressive.percentage = progressive.percentage;
          pendingReleaseItem.progressive["current-percentage"] = progressive["current-percentage"];
          pendingReleaseItem.progressive.paused = progressive.paused;
        }
      });
    },
  }
});

// don't export addPendingClose to force using the thunk CloseChannel
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
