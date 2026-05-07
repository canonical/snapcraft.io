import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { ArchitecturesState, Revision } from "../../../types/releaseTypes";

const architecturesSlice = createSlice({
  name: "architectures",
  initialState: [] as ArchitecturesState,
  reducers: {
    updateArchitectures: {
      prepare(revisions: Revision[]) {
        let archs: Set<string> = new Set();
        revisions.forEach((revision) => {
          revision.architectures.forEach((arch) => archs.add(arch));
        });
        return { payload: [...archs].sort() };
      },
      // reducer receives the already-processed payload
      reducer(_state, action: PayloadAction<ArchitecturesState>) {
        return action.payload;
      },
    }
  },
});

export const { updateArchitectures } = architecturesSlice.actions;
export default architecturesSlice.reducer;
