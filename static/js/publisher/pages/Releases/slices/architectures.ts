import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { ArchitecturesState, Revision } from "../../../types/releaseTypes";

const architecturesSlice = createSlice({
  name: "architectures",
  initialState: [] as ArchitecturesState,
  reducers: {
    updateArchitectures: {
      prepare(revisions: Revision[]) {
        let archs: string[] = [];
        revisions.forEach((revision) => {
          archs = archs.concat(revision.architectures);
        });
        archs = archs.filter((item, i, ar) => ar.indexOf(item) === i);
        return { payload: archs };
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
