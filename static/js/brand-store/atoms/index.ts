import { atom } from "recoil";
import type { Store, Model, Policy } from "../types/shared";

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

const policiesState = atom({
  key: "policies",
  default: [] as Array<Policy>,
});

export {
  brandStoresState,
  modelsListState,
  modelsListFilterState,
  newModelState,
  policiesState,
};
