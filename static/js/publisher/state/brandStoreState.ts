import { atom as jotaiAtom } from "jotai";
import { atomFamily } from "jotai/utils";

import { Store } from "../types/shared";

const brandStoresState = jotaiAtom([]);

const brandIdState = jotaiAtom("");

const brandStoreState = atomFamily((storeId) =>
  jotaiAtom((get) => {
    const brandStores: Store[] = get(brandStoresState);
    return brandStores.find((store) => store.id === storeId);
  }),
);

export { brandStoresState, brandIdState, brandStoreState };
