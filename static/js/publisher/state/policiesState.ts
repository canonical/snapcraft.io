import { atom, selector } from "recoil";

import { signingKeysListState } from "./signingKeysState";

import { Policy } from "../types/shared";

function getFilteredPolicies(
  policies: Array<Policy>,
  filterQuery?: string | null,
) {
  if (!filterQuery) {
    return policies;
  }

  return policies.filter((policy: Policy) => {
    if (
      (policy["signing-key-name"] &&
        policy["signing-key-name"].includes(filterQuery)) ||
      policy["created-at"].includes(filterQuery) ||
      (policy["modified-at"] && policy["modified-at"].includes(filterQuery)) ||
      policy.revision.toString().includes(filterQuery)
    ) {
      return true;
    }

    return false;
  });
}

const policiesListState = atom({
  key: "policiesList",
  default: [] as Array<Policy>,
});

const policiesListFilterState = atom({
  key: "policiesListFilter",
  default: "" as string,
});

const filteredPoliciesListState = selector<Array<Policy>>({
  key: "filteredPoliciesList",
  get: ({ get }) => {
    const filter = get(policiesListFilterState);
    const policies = get(policiesListState);
    const signingKeys = get(signingKeysListState);
    const policiesWithKeys = policies.map((policy) => {
      const signingKey = signingKeys.find(
        (key) => key["sha3-384"] === policy["signing-key-sha3-384"],
      );

      return {
        ...policy,
        "signing-key-name": signingKey?.name,
      };
    });

    return getFilteredPolicies(policiesWithKeys, filter);
  },
  set: ({ set }, newValue) => {
    set(policiesListState, newValue);
  },
});

export {
  policiesListState,
  policiesListFilterState,
  filteredPoliciesListState,
};
