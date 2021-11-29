import {
  BrandStores,
  CurrentStore,
  Snaps,
  Invites,
  Members,
} from "../types/shared";

export const brandStoresListSelector = (state: BrandStores) =>
  state.brandStores.brandStoresList;
export const currentStoreSelector = (state: CurrentStore) =>
  state.currentStore.currentStore;
export const snapsSelector = (state: Snaps) => state.snaps.snaps;
export const membersSelector = (state: Members) => state.members.members;
export const invitesSelector = (state: Invites) => state.invites.invites;
