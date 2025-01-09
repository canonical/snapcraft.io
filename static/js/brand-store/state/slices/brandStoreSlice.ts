import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppDispatch } from "../store";

export const slice = createSlice({
  name: "brandStores",
  initialState: {
    brandStoresList: [],
    loading: true,
    notFound: false,
  },
  reducers: {
    getBrandStoresLoading: (state) => {
      state.loading = true;
    },
    getBrandStoresSuccess: (state, action: PayloadAction<[]>) => {
      state.brandStoresList = action.payload || [];
      state.loading = false;
    },
    getBrandStoresNotFound: (state) => {
      state.notFound = true;
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
  getBrandStoresNotFound,
  getBrandStoresError,
} = slice.actions;

export function fetchStores() {
  return async (dispatch: AppDispatch) => {
    dispatch(getBrandStoresLoading());

    try {
      const response = await fetch("/api/stores");
      const responseData = await response.json();
      dispatch(getBrandStoresSuccess(responseData.data));
    } catch (_) {
      dispatch(getBrandStoresNotFound());
      dispatch(getBrandStoresError());
    }
  };
}

export default slice.reducer;
