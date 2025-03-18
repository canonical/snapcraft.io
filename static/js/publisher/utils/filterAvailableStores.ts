import type { AvailableStores } from "../types/shared";

function filterAvailableStores(stores: AvailableStores) {
  const PUBLIC_STORES = ["LimeNET", "LimeSDR", "orange-pi", "china"];

  return stores.filter((store) => !PUBLIC_STORES.includes(store.id));
}

export default filterAvailableStores;
