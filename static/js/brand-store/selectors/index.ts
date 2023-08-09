import { selector, selectorFamily } from "recoil";

import {
  modelsListFilterState,
  modelsListState,
  policiesListState,
  policiesListFilterState,
  signingKeysListState,
  brandStoresState,
  signingKeysListFilterState,
} from "../atoms";

import {
  getFilteredModels,
  getFilteredPolicies,
  getFilteredSigningKeys,
} from "../utils";

import type {
  StoresSlice,
  CurrentStoreSlice,
  SnapsSlice,
  InvitesSlice,
  MembersSlice,
  Model,
  Policy,
  SigningKey,
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
    const policies = get(policiesListState);
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

const filteredPoliciesListState = selector<Array<Policy>>({
  key: "filteredPoliciesList",
  get: ({ get }) => {
    const filter = get(policiesListFilterState);
    const policies = get(policiesListState);
    const signingKeys = get(signingKeysListState);
    const policiesWithKeys = policies.map((policy) => {
      const signingKey = signingKeys.find(
        (key) => key["sha3-384"] === policy["signing-key-sha3-384"]
      );

      return {
        ...policy,
        "signing-key-name": signingKey?.name,
      };
    });

    return getFilteredPolicies(policiesWithKeys, filter);
  },
});

const brandStoreState = selectorFamily({
  key: "brandStore",
  get: (storeId) => ({ get }) => {
    const brandStores = get(brandStoresState);
    return brandStores.find((store) => store.id === storeId);
  },
});

const filteredSigningKeysListState = selector<Array<SigningKey>>({
  key: "filteredSigningKeysList",
  get: ({ get }) => {
    const filter = get(signingKeysListFilterState);
    const policies = get(policiesListState);
    const signingKeys = get(signingKeysListState);
    const signingKeysWithPolicies = signingKeys.map((signingKey) => {
      const matchingPolicies = policies.filter((policy) => {
        return policy["signing-key-sha3-384"] === signingKey["sha3-384"];
      });

      const signingKeyModels: string[] = [];

      matchingPolicies.forEach((policy) => {
        if (!signingKeyModels.includes(policy["model-name"])) {
          signingKeyModels.push(policy["model-name"]);
        }
      });

      return {
        ...signingKey,
        models: signingKeyModels,
        policies: matchingPolicies,
      };
    });

    return getFilteredSigningKeys(signingKeysWithPolicies, filter);
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
  filteredPoliciesListState,
  brandStoreState,
  filteredSigningKeysListState,
};
