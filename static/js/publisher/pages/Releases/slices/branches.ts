import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { BranchesState } from "../../../types/releaseTypes";
import type { AppDispatch, RootState } from "../store";

const branchesSlice = createSlice({
  name: "branches",
  initialState: [] as BranchesState,
  reducers: {
    openBranches(state, action: PayloadAction<string>) {
      if (!state.includes(action.payload)) {
        state.push(action.payload);
      }
    },
    closeBranches(state, action: PayloadAction<string>) {
      const index = state.indexOf(action.payload);
      if (index !== -1) {
        state.splice(index, 1);
      }
    }
  }
});

export const { openBranches, closeBranches } = branchesSlice.actions;
export default branchesSlice.reducer;

export function toggleBranches(channelName: string) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const { branches } = getState();
    if (branches.includes(channelName)) {
      dispatch(closeBranches(channelName));
    } else {
      dispatch(openBranches(channelName));
    }
  };
}
