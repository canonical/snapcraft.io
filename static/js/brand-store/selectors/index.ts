import {
  BrandStores,
  CurrentStore,
  Snaps,
  InvitesSelector,
  Members,
} from "../types/shared";

export const brandStoresListSelector = (state: BrandStores) =>
  state.brandStores.brandStoresList;
export const currentStoreSelector = (state: CurrentStore) =>
  state.currentStore.currentStore;
export const snapsSelector = (state: Snaps) => state.snaps.snaps;
export const membersSelector = (state: Members) => state.members.members;
export const invitesSelector = (state: InvitesSelector) =>
  state.invites.invites;
