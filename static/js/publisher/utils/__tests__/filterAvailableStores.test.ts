import filterAvailableStores from "../filterAvailableStores";

import type { AvailableStores } from "../../types/shared.ts";

const testStores: AvailableStores = [
  {
    id: "ubuntu",
    name: "Global",
    roles: [],
  },
  {
    id: "test-store",
    name: "Test store",
    roles: [],
  },
  {
    id: "example-store",
    name: "Example store",
    roles: [],
  },
  {
    id: "LimeNET",
    name: "LimeNET",
    roles: [],
  },
  {
    id: "LimeSDR",
    name: "LimeSDR",
    roles: [],
  },
  {
    id: "orange-pi",
    name: "Orange Pi",
    roles: [],
  },
  {
    id: "china",
    name: "China",
    roles: [],
  },
];

describe("filterAvailableStores", () => {
  test("filters out LimeNET", () => {
    const availableStores = filterAvailableStores(testStores);
    const limeNetStore = availableStores.find(
      (store) => store.id === "LimeNET",
    );
    expect(limeNetStore).toBeUndefined();
  });

  test("filters out LimeSDR", () => {
    const availableStores = filterAvailableStores(testStores);
    const limeSdrStore = availableStores.find(
      (store) => store.id === "LimeSDR",
    );
    expect(limeSdrStore).toBeUndefined();
  });

  test("filters out Orange Pi", () => {
    const availableStores = filterAvailableStores(testStores);
    const orangePiStore = availableStores.find(
      (store) => store.id === "orange-pi",
    );
    expect(orangePiStore).toBeUndefined();
  });

  test("filters out China", () => {
    const availableStores = filterAvailableStores(testStores);
    const chinaStore = availableStores.find((store) => store.id === "china");
    expect(chinaStore).toBeUndefined();
  });
});
