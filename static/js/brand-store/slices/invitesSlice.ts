import { createSlice } from "@reduxjs/toolkit";
import { AppDispatch } from "../store";

export const slice = createSlice({
  name: "invites",
  initialState: {
    invites: [],
    loading: true,
  },
  reducers: {
    getInvitesLoading: (state) => {
      state.loading = true;
    },
    getInvitesSuccess: (state, { payload }) => {
      state.invites = payload || [];
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
  getInvitesError,
} = slice.actions;

export function fetchInvites(storeId: string) {
  return async (dispatch: AppDispatch) => {
    dispatch(getInvitesLoading());

    try {
      const response = await fetch(`/admin/store/${storeId}/invites`);
      const data = await response.json();

      dispatch(getInvitesSuccess(data));
    } catch (error) {
      dispatch(getInvitesError());
      console.log("API fetch failed");
    }
  };
}

export default slice.reducer;
