import {
  StoresSlice,
  CurrentStoreSlice,
  SnapsSlice,
  InvitesSlice,
  MembersSlice,
} from "../types/shared";

export const brandStoresListSelector = (state: StoresSlice) =>
  state.brandStores.brandStoresList;
export const currentStoreSelector = (state: CurrentStoreSlice) =>
  state.currentStore.currentStore;
export const snapsSelector = (state: SnapsSlice) => state.snaps.snaps;
export const membersSelector = (state: MembersSlice) => state.members.members;
export const invitesSelector = (state: InvitesSlice) => state.invites.invites;
