import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  FailedRevision,
  FailedRevisionsState,
} from "../../../types/releaseTypes";

const failedRevisionsSlice = createSlice({
  name: "failedRevisions",
  initialState: [] as FailedRevisionsState,
  reducers: {
    updateFailedRevisions(state, action: PayloadAction<FailedRevision[]>) {
      const combined = [...state, ...action.payload];
      // deduplicate failed revisions if any
      return combined.filter(
        (item, index, self) =>
          index === self.findIndex(
            (other) => other.channel === item.channel
              && other.architecture === item.architecture
          )
      );
    },
  }
});

export const { updateFailedRevisions } = failedRevisionsSlice.actions;
export default failedRevisionsSlice.reducer;
