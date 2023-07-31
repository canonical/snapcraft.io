import type { SigningKey } from "../types/shared";

function checkSigningKeyExists(name: string, signingKeys: Array<SigningKey>) {
  return (
    signingKeys.filter((signingKey) => signingKey.name === name).length > 0
  );
}

export default checkSigningKeyExists;
