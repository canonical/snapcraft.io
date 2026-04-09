import { createSlice, Draft, PayloadAction } from "@reduxjs/toolkit";
import { AVAILABLE } from "../constants";
import type { ChannelMapState, Revision } from "../../../types/releaseTypes";

function handleRevisionSelection(
  state: Draft<ChannelMapState>,
  revision: Revision,
  toggle: boolean,
) {
  const arch = revision.architectures[0];
  if (
    toggle &&
    state[AVAILABLE][arch] &&
    state[AVAILABLE][arch].revision === revision.revision
  ) {
    delete state[AVAILABLE][arch];
  } else {
    state[AVAILABLE][arch] = { ...revision };
  }
}

export type ReleaseRevisionSuccessPayload = {
  revision: Revision;
  channel: string;
};

const channelMapSlice = createSlice({
  name: "channelMap",
  initialState: {} as ChannelMapState,
  reducers: {
    initChannelMap(_state, action: PayloadAction<ChannelMapState>) {
      return action.payload;
    },
    selectRevision(state, action: PayloadAction<Revision>) {
      handleRevisionSelection(state, action.payload, false);
    },
    toggleRevision(state, action: PayloadAction<Revision>) {
      handleRevisionSelection(state, action.payload, true);
    },
    clearSelectedRevisions(state) {
      state[AVAILABLE] = {}
    },
    releaseRevisionSuccess(state, action: PayloadAction<ReleaseRevisionSuccessPayload>) {
      const revision = action.payload.revision;
      const channel = action.payload.channel;
      revision.architectures.forEach((arch) => {
        const currentChannel = state[channel] || {};
        const currentlyReleased = currentChannel[arch];
        // only update revision in channel map if it changed since last time
        if (
          !currentlyReleased ||
          currentlyReleased.revision !== revision.revision
        ) {
          state[channel][arch] = { ...revision };
        }
      });
    },
    closeChannelSuccess(state, action: PayloadAction<string>) {
      const channel = action.payload;
      // if channel is already closed do nothing
      if (state[channel]) {
        delete state[channel];
      }
    },
  }
});

export const {
  initChannelMap,
  selectRevision,
  toggleRevision,
  clearSelectedRevisions,
  releaseRevisionSuccess,
  closeChannelSuccess,
} = channelMapSlice.actions;
export default channelMapSlice.reducer;
