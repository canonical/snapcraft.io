import { useQuery, UseQueryResult } from "react-query";
import type { SigningKey } from "../types/shared";

const useSigningKeys = (
  storeId: string | undefined,
): UseQueryResult<SigningKey[], Error> => {
  return useQuery<SigningKey[], Error>({
    queryKey: ["signingKeys", storeId],
    queryFn: async () => {
      const response = await fetch(`/api/store/${storeId}/signing-keys`);

      if (!response.ok) {
        throw new Error("There was a problem fetching signing keys");
      }

      const signingKeysData = await response.json();

      if (!signingKeysData.success) {
        throw new Error(signingKeysData.message);
      }

      return signingKeysData.data;
    },
  });
};

export default useSigningKeys;
