import { configureStore } from "@reduxjs/toolkit";
import brandStoreReducer from "../slices/brandStoreSlice";
import currentStoreReducer from "../slices/currentStoreSlice";
import snapsSelector from "../slices/snapsSlice";
import membersSelector from "../slices/membersSlice";
import invitesSelector from "../slices/invitesSlice";

export default configureStore({
  reducer: {
    brandStores: brandStoreReducer,
    currentStore: currentStoreReducer,
    snaps: snapsSelector,
    members: membersSelector,
    invites: invitesSelector,
  },
});
