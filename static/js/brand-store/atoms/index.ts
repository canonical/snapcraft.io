import { atom } from "recoil";

import type { Store } from "../types/shared";

const brandStoresState = atom({
  key: "brandStoresState",
  default: [] as Array<Store>,
});

export { brandStoresState };
