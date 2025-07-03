import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

import { Store } from "../types/shared";

const brandStoresState = atom([]);

const brandIdState = atom("");

const brandStoreState = atomFamily((storeId) =>
  atom((get) => {
    const brandStores: Store[] = get(brandStoresState);
    return brandStores.find((store) => store.id === storeId);
  }),
);

export { brandStoresState, brandIdState, brandStoreState };
