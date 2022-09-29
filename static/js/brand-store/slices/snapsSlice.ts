import { createSlice } from "@reduxjs/toolkit";
import { AppDispatch } from "../store";

export const slice = createSlice({
  name: "snaps",
  initialState: {
    snaps: [],
    loading: true,
    notFound: false,
  },
  reducers: {
    getSnapsLoading: (state) => {
      state.loading = true;
    },
    getSnapsSuccess: (state, { payload }) => {
      state.snaps = payload || [];
      state.loading = false;
    },
    getSnapsNotFound: (state) => {
      state.notFound = true;
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
  getSnapsNotFound,
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
      dispatch(getSnapsNotFound());
      dispatch(getSnapsError());
    }
  };
}

export default slice.reducer;
