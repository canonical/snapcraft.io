import { atom, selectorFamily } from "recoil";
import { atom as jotaiAtom } from "jotai";

import type { Store } from "../types/shared";

const brandStoresState = atom({
  key: "brandStores",
  default: [] as Array<Store>,
});

const brandIdState = jotaiAtom("");

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
