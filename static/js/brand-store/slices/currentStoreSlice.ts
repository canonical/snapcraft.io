import { createSlice } from "@reduxjs/toolkit";
import { AppDispatch } from "../store";

export const slice = createSlice({
  name: "currentStore",
  initialState: {
    currentStore: {},
    loading: true,
  },
  reducers: {
    getCurrentStoreLoading: (state) => {
      state.loading = true;
    },
    getCurrentStoreSuccess: (state, { payload }) => {
      state.currentStore = payload || [];
      state.loading = false;
    },
    getCurrentStoreError: (state) => {
      state.loading = false;
    },
  },
});

export const {
  getCurrentStoreLoading,
  getCurrentStoreSuccess,
  getCurrentStoreError,
} = slice.actions;

export function fetchStore(storeId: string) {
  return async (dispatch: AppDispatch) => {
    dispatch(getCurrentStoreLoading());

    try {
      const response = await fetch(`/admin/store/${storeId}`);
      const data = await response.json();

      dispatch(getCurrentStoreSuccess(data));
    } catch (error) {
      dispatch(getCurrentStoreError());
      console.log("API fetch failed");
    }
  };
}

export default slice.reducer;
