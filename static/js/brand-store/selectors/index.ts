import { selector, selectorFamily } from "recoil";

import {
  modelsListFilterState,
  modelsListState,
  policiesState,
} from "../atoms";

import { getFilteredModels } from "../utils";

import type {
  StoresSlice,
  CurrentStoreSlice,
  SnapsSlice,
  InvitesSlice,
  MembersSlice,
  Model,
} from "../types/shared";

// Redux selectors
const brandStoresListSelector = (state: StoresSlice) =>
  state.brandStores.brandStoresList;
const currentStoreSelector = (state: CurrentStoreSlice) =>
  state.currentStore.currentStore;
const snapsSelector = (state: SnapsSlice) => state.snaps.snaps;
const membersSelector = (state: MembersSlice) => state.members.members;
const invitesSelector = (state: InvitesSlice) => state.invites.invites;

// Recoil selectors
const filteredModelsListState = selector<Array<Model>>({
  key: "filteredModelsList",
  get: ({ get }) => {
    const filter = get(modelsListFilterState);
    const models = get(modelsListState);
    const policies = get(policiesState);
    const modelsWithPolicies = models.map((model) => {
      const policy = policies.find(
        (policy) => policy["model-name"] === model.name
      );

      return {
        ...model,
        "policy-revision": policy ? policy.revision : undefined,
      };
    });

    return getFilteredModels(modelsWithPolicies, filter);
  },
});

const currentModelState = selectorFamily({
  key: "currentModel",
  get: (modelId) => ({ get }) => {
    const models = get(modelsListState);
    return models.find((model) => model.name === modelId);
  },
});

export {
  brandStoresListSelector,
  currentStoreSelector,
  snapsSelector,
  membersSelector,
  invitesSelector,
  filteredModelsListState,
  currentModelState,
};
