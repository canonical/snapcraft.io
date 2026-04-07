import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  CurrentTrackState,
} from "../../../types/releaseTypes";

const currentTrackSlice = createSlice({
  name: "currentTrack",
  initialState: "" as CurrentTrackState,
  reducers: {
    setCurrentTrack(_state, action: PayloadAction<string>) {
      return action.payload;
    }
  }
});

export const { setCurrentTrack } = currentTrackSlice.actions;
export default currentTrackSlice.reducer;
