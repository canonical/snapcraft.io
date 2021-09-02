import { configureStore } from "@reduxjs/toolkit";
import brandStoreReducer from "../slices/brandStoreSlice";

export default configureStore({
  reducer: {
    brandStores: brandStoreReducer,
  },
});
