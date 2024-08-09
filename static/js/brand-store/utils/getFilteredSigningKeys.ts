import type { SigningKey } from "../types/shared";

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

export default getFilteredSigningKeys;
