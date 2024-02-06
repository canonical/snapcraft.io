import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { AppDispatch } from "../store";

import type { Member } from "../types/shared";

export const fetchMembers = createAsyncThunk<Member[], string>(
  "members/fetchMembers",
  async (storeId: string) => {
    const response = await fetch(`/admin/store/${storeId}/members`);
    const data = await response.json();

    return data;
  }
);

export const slice = createSlice({
  name: "members",
  initialState: {
    members: [],
    loading: true,
    notFound: false,
  },
  reducers: {
    getMembersLoading: (state) => {
      state.loading = true;
      state.notFound = false;
    },
    getMembersSuccess: (state, { payload }) => {
      state.members = payload || [];
      state.loading = false;
      state.notFound = false;
    },
    getMembersNotFound: (state) => {
      state.notFound = true;
      state.loading = false;
    },
    getMembersError: (state) => {
      state.loading = false;
    },
  },
  extraReducers: {
    [fetchMembers.pending.type]: (state) => {
      state.loading = true;
    },
    [fetchMembers.fulfilled.type]: (state, { payload }) => {
      state.loading = false;
      state.members = payload;
    },
    [fetchMembers.rejected.type]: (state) => {
      state.loading = false;
    },
  },
});

export const {
  getMembersLoading,
  getMembersSuccess,
  getMembersNotFound,
  getMembersError,
} = slice.actions;

export default slice.reducer;
