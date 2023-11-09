import type { Store } from "../types/shared";

function getStoreName(storeId: string | undefined, stores: Array<Store>) {
  const store = stores.find((store) => store.id === storeId);

  if (!store) {
    return storeId;
  }

  return store.name;
}

export default getStoreName;
