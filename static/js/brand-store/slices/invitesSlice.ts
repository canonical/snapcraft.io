import { createSlice } from "@reduxjs/toolkit";
import { AppDispatch } from "../store";
import { getMembersNotFound } from "./membersSlice";

export const slice = createSlice({
  name: "invites",
  initialState: {
    invites: [],
    loading: true,
    notFound: false,
  },
  reducers: {
    getInvitesLoading: (state) => {
      state.loading = true;
    },
    getInvitesSuccess: (state, { payload }) => {
      state.invites = payload || [];
      state.loading = false;
    },
    getInvitesNotFound: (state) => {
      state.notFound = true;
      state.loading = false;
    },
    getInvitesError: (state) => {
      state.loading = false;
    },
  },
});

export const {
  getInvitesLoading,
  getInvitesSuccess,
  getInvitesNotFound,
  getInvitesError,
} = slice.actions;

export function fetchInvites(storeId: string) {
  return async (dispatch: AppDispatch) => {
    dispatch(getInvitesLoading());

    try {
      const response = await fetch(`/api/store/${storeId}/invites`);
      const data = await response.json();
      dispatch(getInvitesSuccess(data));
    } catch (_) {
      dispatch(getMembersNotFound());
      dispatch(getInvitesError());
    }
  };
}

export default slice.reducer;
