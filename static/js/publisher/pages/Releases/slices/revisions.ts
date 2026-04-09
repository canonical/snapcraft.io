import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  RevisionsState,
} from "../../../types/releaseTypes";


const revisionsSlice = createSlice({
  name: "revisions",
  initialState: {} as RevisionsState,
  reducers: {
    updateRevisions(_state, action: PayloadAction<RevisionsState>) {
      return action.payload;
    },
  }
});

export const { updateRevisions } = revisionsSlice.actions;
export default revisionsSlice.reducer;
