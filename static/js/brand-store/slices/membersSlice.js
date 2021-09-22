import { createSlice } from "@reduxjs/toolkit";

export const slice = createSlice({
  name: "members",
  initialState: {
    members: [],
    loading: true,
  },
  reducers: {
    getMembersLoading: (state) => {
      state.loading = true;
    },
    getMembersSuccess: (state, { payload }) => {
      state.members = payload || [];
      state.loading = false;
    },
    getMembersError: (state) => {
      state.loading = false;
    },
  },
});

export const {
  getMembersLoading,
  getMembersSuccess,
  getMembersError,
} = slice.actions;

export function fetchMembers(storeId) {
  return async (dispatch) => {
    dispatch(getMembersLoading());

    try {
      const response = await fetch(`/admin/store/${storeId}/members`);
      const data = await response.json();

      dispatch(getMembersSuccess(data));
    } catch (error) {
      dispatch(getMembersError());
      console.log("API fetch failed");
    }
  };
}

export default slice.reducer;
