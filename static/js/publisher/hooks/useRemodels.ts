import { useQuery, UseQueryResult } from "react-query";
import type { Remodel, RemodelResponse, ApiResponse } from "../types/shared";

const useRemodels = (
  brandId: string | undefined,
  modelId: string | undefined,
): UseQueryResult<ApiResponse<RemodelResponse>, Error> => {
  return useQuery<ApiResponse<RemodelResponse>, Error>({
    queryKey: ["remodels", brandId, modelId],
    queryFn: async () => {
      const response = await fetch(
        `/api/store/${brandId}/models/remodel-allowlist`,
      );

      const responseData = await response.json();

      if (responseData.data?.allowlist) {
        const remodelsForCurrentModel = responseData.data.allowlist.filter(
          (remodel: Remodel) => {
            return (
              remodel["from-model"] === modelId ||
              remodel["to-model"] === modelId
            );
          },
        );

        responseData.data.allowlist = remodelsForCurrentModel.sort(
          (a: Remodel, b: Remodel) => {
            if (a["created-at"] > b["created-at"]) {
              return -1;
            }

            if (a["created-at"] < b["created-at"]) {
              return 1;
            }

            return 0;
          },
        );
      }

      return responseData;
    },
    enabled: !!brandId,
  });
};

export default useRemodels;
