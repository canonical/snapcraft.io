import { atom } from "jotai";
import { atomFamily } from "jotai-family";

import type { Store } from "../types/shared";

const brandStoresState = atom([] as Store[]);

const brandIdState = atom("");

const brandStoreState = atomFamily((storeId) => {
  return atom((get) => {
    const brandStores: Store[] = get(brandStoresState);
    return brandStores.find((store) => store.id === storeId);
  });
});

export { brandStoresState, brandIdState, brandStoreState };
