import { atom, selector } from "recoil";

import { SigningKey } from "../types/shared";

import { policiesListState } from "./policiesState";

function getFilteredSigningKeys(
  signingKeys: Array<SigningKey>,
  filterQuery?: string | null,
) {
  if (!filterQuery) {
    return signingKeys;
  }

  return signingKeys.filter((signingKey: SigningKey) => {
    if (
      (signingKey.name && signingKey.name.includes(filterQuery)) ||
      (signingKey["created-at"] &&
        signingKey["created-at"].includes(filterQuery)) ||
      (signingKey["modified-at"] &&
        signingKey["modified-at"].includes(filterQuery)) ||
      (signingKey.fingerprint &&
        signingKey.fingerprint.toString().includes(filterQuery))
    ) {
      return true;
    }

    return false;
  });
}

const signingKeysListState = atom<SigningKey[]>({
  key: "signingKeysListState",
  default: [],
});

const signingKeysListFilterState = atom({
  key: "signingKeysListFilter",
  default: "" as string,
});

const newSigningKeyState = atom({
  key: "newSigningKey",
  default: {
    name: "",
  },
});

const filteredSigningKeysListState = selector<Array<SigningKey>>({
  key: "filteredSigningKeysList",
  get: ({ get }) => {
    const filter = get(signingKeysListFilterState);
    const policies = get(policiesListState);
    const signingKeys = get(signingKeysListState);
    const signingKeysWithPolicies = signingKeys.map((signingKey) => {
      const matchingPolicies = policies.filter((policy) => {
        return policy["signing-key-sha3-384"] === signingKey["sha3-384"];
      });

      const signingKeyModels: string[] = [];

      matchingPolicies.forEach((policy) => {
        if (!signingKeyModels.includes(policy["model-name"])) {
          signingKeyModels.push(policy["model-name"]);
        }
      });

      return {
        ...signingKey,
        models: signingKeyModels,
        policies: matchingPolicies,
      };
    });

    return getFilteredSigningKeys(signingKeysWithPolicies, filter);
  },
});

export {
  signingKeysListState,
  signingKeysListFilterState,
  newSigningKeyState,
  filteredSigningKeysListState,
};
