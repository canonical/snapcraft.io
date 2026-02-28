import { createSlice } from "@reduxjs/toolkit";
import { AppDispatch } from "../store";

export const slice = createSlice({
  name: "snaps",
  initialState: {
    snaps: [],
    loading: true,
  },
  reducers: {
    getSnapsLoading: (state) => {
      state.loading = true;
    },
    getSnapsSuccess: (state, { payload }) => {
      state.snaps = payload || [];
      state.loading = false;
    },
    getSnapsError: (state) => {
      state.loading = false;
    },
  },
});

export const {
  getSnapsLoading,
  getSnapsSuccess,
  getSnapsError,
} = slice.actions;

export function fetchSnaps(storeId: string) {
  return async (dispatch: AppDispatch) => {
    dispatch(getSnapsLoading());

    try {
      const response = await fetch(`/admin/store/${storeId}/snaps`);
      const data = await response.json();

      dispatch(getSnapsSuccess(data));
    } catch (error) {
      dispatch(getSnapsError());
      console.log("API fetch failed");
    }
  };
}

export default slice.reducer;
