import { configureStore } from "@reduxjs/toolkit";
import brandStoreReducer from "../slices/brandStoreSlice";
import currentStoreReducer from "../slices/currentStoreSlice";
import snapsSelector from "../slices/snapsSlice";
import membersSelector from "../slices/membersSlice";
import invitesSelector from "../slices/invitesSlice";
import { useDispatch } from "react-redux";

function configureAppStore() {
  const store = configureStore({
    reducer: {
      brandStores: brandStoreReducer,
      currentStore: currentStoreReducer,
      snaps: snapsSelector,
      members: membersSelector,
      invites: invitesSelector,
    },
  });

  return store;
}

const store = configureAppStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export { store };
