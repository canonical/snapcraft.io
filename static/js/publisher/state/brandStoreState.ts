import { atom, selectorFamily } from "recoil";

import type { Store } from "../types/shared";

const brandStoresState = atom({
  key: "brandStores",
  default: [] as Array<Store>,
});

const brandIdState = atom({
  key: "brandId",
  default: "",
});

const brandStoreState = selectorFamily({
  key: "brandStore",
  get:
    (storeId) =>
    ({ get }) => {
      const brandStores = get(brandStoresState);
      return brandStores.find((store) => store.id === storeId);
    },
});

export { brandStoresState, brandIdState, brandStoreState };
