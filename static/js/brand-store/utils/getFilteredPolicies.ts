import type { Policy } from "../types/shared";

function getFilteredPolicies(
  policies: Array<Policy>,
  filterQuery?: string | null
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

export default getFilteredPolicies;
