import { createSlice } from "@reduxjs/toolkit";

export const slice = createSlice({
  name: "brandStores",
  initialState: {
    brandStoresList: [],
    loading: true,
  },
  reducers: {
    getBrandStoresLoading: (state) => {
      state.loading = true;
    },
    getBrandStoresSuccess: (state, { payload }) => {
      state.brandStoresList = payload || [];
      state.loading = false;
    },
    getBrandStoresError: (state) => {
      state.loading = false;
    },
  },
});

export const {
  getBrandStoresLoading,
  getBrandStoresSuccess,
  getBrandStoresError,
} = slice.actions;

export function fetchStores() {
  return async (dispatch) => {
    dispatch(getBrandStoresLoading());

    try {
      const response = await fetch("/admin/stores");
      const data = await response.json();

      dispatch(getBrandStoresSuccess(data));
    } catch (error) {
      dispatch(getBrandStoresError());
      console.log("API fetch failed");
    }
  };
}

export default slice.reducer;
