import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import type { Snap } from "../../types/shared";

export const fetchSnaps = createAsyncThunk<Snap[], string>(
  "snaps/fetchSnaps",
  async (storeId: string) => {
    const response = await fetch(`/api/store/${storeId}/snaps`);
    const data = await response.json();

    return data;
  },
);

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
      state.notFound = false;
    },
    getSnapsSuccess: (state, { payload }) => {
      state.snaps = payload || [];
      state.loading = false;
      state.notFound = false;
    },
    getSnapsNotFound: (state) => {
      state.notFound = true;
      state.loading = false;
    },
    getSnapsError: (state) => {
      state.loading = false;
    },
  },
  extraReducers: {
    [fetchSnaps.pending.type]: (state) => {
      state.loading = true;
    },
    [fetchSnaps.fulfilled.type]: (state, { payload }) => {
      state.loading = false;
      state.snaps = payload;
    },
    [fetchSnaps.rejected.type]: (state) => {
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

export default slice.reducer;
