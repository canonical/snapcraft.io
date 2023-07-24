import { atom } from "recoil";
import type { Store, Model, Policy, SigningKey } from "../types/shared";

const brandStoresState = atom({
  key: "brandStores",
  default: [] as Array<Store>,
});

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

const policiesListState = atom({
  key: "policiesList",
  default: [] as Array<Policy>,
});

const policiesListFilterState = atom({
  key: "policiesListFilter",
  default: "" as string,
});

const signingKeysListState = atom({
  key: "signingKeysList",
  default: [] as Array<SigningKey>,
});

export {
  brandStoresState,
  modelsListState,
  modelsListFilterState,
  newModelState,
  policiesListState,
  policiesListFilterState,
  signingKeysListState,
};
