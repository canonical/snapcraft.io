import { configureStore } from "@reduxjs/toolkit";
import brandStoreReducer from "../slices/brandStoreSlice";
import currentStoreReducer from "../slices/currentStoreSlice";

export default configureStore({
  reducer: {
    brandStores: brandStoreReducer,
    currentStore: currentStoreReducer,
  },
});
