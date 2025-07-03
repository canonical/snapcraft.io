import { atom } from "jotai";

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

const policiesListState = atom([] as Policy[]);

const policiesListFilterState = atom("" as string);

const filteredPoliciesListState = atom(
  (get) => {
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
  (_get, set, newValue: Policy[]) => {
    set(policiesListState, newValue);
  },
);

export {
  policiesListState,
  policiesListFilterState,
  filteredPoliciesListState,
};
