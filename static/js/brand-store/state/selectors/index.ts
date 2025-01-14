import type {
  StoresSlice,
  CurrentStoreSlice,
  SnapsSlice,
  InvitesSlice,
  MembersSlice,
} from "../../types/shared";

const brandStoresListSelector = (state: StoresSlice) =>
  state.brandStores.brandStoresList;
const currentStoreSelector = (state: CurrentStoreSlice) =>
  state.currentStore.currentStore;
const snapsSelector = (state: SnapsSlice) => state.snaps.snaps;
const membersSelector = (state: MembersSlice) => state.members.members;
const invitesSelector = (state: InvitesSlice) => state.invites.invites;

export {
  brandStoresListSelector,
  currentStoreSelector,
  snapsSelector,
  membersSelector,
  invitesSelector,
};
