import { atom, selector, selectorFamily } from "recoil";

import { policiesListState } from "./policiesState";

import { Model } from "../types/shared";

function getFilteredModels(models: Array<Model>, filterQuery?: string | null) {
  if (!filterQuery) {
    return models;
  }

  return models.filter((model: Model) => {
    if (
      (model.name && model.name.includes(filterQuery)) ||
      (model["api-key"] && model["api-key"].includes(filterQuery)) ||
      (model["created-at"] && model["created-at"].includes(filterQuery)) ||
      (model["modified-at"] && model["modified-at"].includes(filterQuery))
    ) {
      return true;
    }

    return false;
  });
}

const modelsListState = atom({
  key: "modelsList",
  default: [] as Array<Model>,
});

const modelsListFilterState = atom({
  key: "modelsListFilter",
  default: "" as string,
});

const newModelState = atom({
  key: "newModel",
  default: {
    name: "",
    apiKey: "",
  },
});

const filteredModelsListState = selector<Array<Model>>({
  key: "filteredModelsList",
  get: ({ get }) => {
    const filter = get(modelsListFilterState);
    const models = get(modelsListState);
    const policies = get(policiesListState);
    const modelsWithPolicies = models.map((model) => {
      const policy = policies.find(
        (policy) => policy["model-name"] === model.name,
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
  get:
    (modelId) =>
    ({ get }) => {
      const models = get(modelsListState);
      return models.find((model) => model.name === modelId);
    },
});

export {
  modelsListState,
  modelsListFilterState,
  newModelState,
  filteredModelsListState,
  currentModelState,
};
