import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  OptionsState,
} from "../../../types/releaseTypes";

const optionsSlice = createSlice({
  name: "options",
  initialState: {
    flags: {},
    snapName: "",
    releasesReady: false,
  } as OptionsState,
  reducers: {
    releasesReady(state, action: PayloadAction<boolean>) {
      state.releasesReady = action.payload;
    },
    initOptions(_state, action: PayloadAction<OptionsState>) {
      return action.payload;
    },
  }
});

export const { releasesReady, initOptions } = optionsSlice.actions;
export default optionsSlice.reducer;
