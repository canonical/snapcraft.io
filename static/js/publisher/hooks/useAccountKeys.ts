import { useQuery } from "react-query";
import { AccountKeyData } from "../types/accountKeysTypes";

function useAccountKeys() {
  return useQuery("account_keys", async () => {
    const response = await fetch("/account-keys.json");

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const keys = await response.json();
    return [...MOCK, ...keys] as AccountKeyData[];
  });
}

export default useAccountKeys;

// TODO: remove
const MOCK = [
  {
    name: "testkey",
    "public-key-sha3-384":
      "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    since: "2025-08-05T10:14:48.604Z",
    until: "2026-12-31T23:59:59.999Z",
    constraints: [
      {
        headers: {
          type: "snap-build",
        },
      },
      {
        headers: {
          type: "snap-revision",
        },
      },
      {
        headers: {
          type: "model",
          model: "modelname", // valid just for "modelname"
        },
      },
      {
        headers: {
          type: "model",
          model: "test-.*", // valid just for any model
        },
      },
      {
        headers: {
          type: "serial",
          model: "serialvalue",
        },
      },
      {
        headers: {
          type: "system-user",
          models: "something-entirely-different", // no idea what this is...
        },
      },
      {
        headers: {
          type: "system-user",
          models: ["something", "something-else"], // or why it can accept arrays
        },
      },
    ],
  },
  {
    name: "testkey2",
    "public-key-sha3-384":
      "0000000000000000000000000000000000000000000000000000000000000000",
    since: "2025-08-05T11:14:48.604Z",
    until: "2025-10-08T23:59:59.999Z",
    constraints: [
      {
        headers: {
          type: "model",
          model: ".*",
        },
      },
      {
        headers: {
          type: "serial",
          model: "serialvalue2",
        },
      },
    ],
  },
];
