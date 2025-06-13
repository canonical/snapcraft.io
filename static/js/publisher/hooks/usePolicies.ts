import { useQuery } from "react-query";
import type { Policy } from "../types/shared";
import { UsePoliciesResponse, ApiError } from "../types/shared";

function usePolicies(
  storeId: string | undefined,
  modelId: string | undefined,
): UsePoliciesResponse {
  return useQuery<Policy[], ApiError>({
    queryKey: ["policies", storeId],
    queryFn: async () => {
      const response = await fetch(
        `/api/store/${storeId}/models/${modelId}/policies`,
      );

      if (!response.ok) {
        throw new Error("There was a problem fetching policies");
      }

      const policiesData = await response.json();

      if (!policiesData.success) {
        throw new Error(policiesData.message);
      }

      return policiesData.data;
    },
  });
}

export default usePolicies;
