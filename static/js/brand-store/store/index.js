import { configureStore } from "@reduxjs/toolkit";
import brandStoreReducer from "../slices/brandStoreSlice";
import currentStoreReducer from "../slices/currentStoreSlice";
import snapsSelector from "../slices/snapsSlice";

export default configureStore({
  reducer: {
    brandStores: brandStoreReducer,
    currentStore: currentStoreReducer,
    snaps: snapsSelector,
  },
});
