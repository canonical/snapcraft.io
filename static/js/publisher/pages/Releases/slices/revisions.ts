import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  Revision,
  RevisionsState,
} from "../../../types/releaseTypes";


const revisionsSlice = createSlice({
  name: "revisions",
  initialState: {} as RevisionsState,
  reducers: {
    updateRevisions(_state, action: PayloadAction<RevisionsState>) {
      return action.payload;
    },
    updateRevision(state, action: PayloadAction<Revision>) {
      state[action.payload.revision] = action.payload;
    }
  }
});

export const { updateRevision, updateRevisions } = revisionsSlice.actions;
export default revisionsSlice.reducer;
