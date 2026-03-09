import { useQuery, UseQueryResult } from "react-query";
import type { Remodel } from "../types/shared";

const useRemodels = (
  brandId: string | undefined,
  modelId: string | undefined,
): UseQueryResult<Remodel[], Error> => {
  return useQuery<Remodel[], Error>({
    queryKey: ["remodels", brandId, modelId],
    queryFn: async () => {
      const response = await fetch(
        `/api/store/${brandId}/models/remodel-allowlist`,
      );

      if (!response.ok) {
        throw new Error("There was a problem fetching remodels");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      const remodelsForCurrentModel = data.data.allowlist.filter(
        (remodel: Remodel) => {
          return (
            remodel["from-model"] === modelId || remodel["to-model"] === modelId
          );
        },
      );

      return remodelsForCurrentModel.sort((a: Remodel, b: Remodel) => {
        if (a["created-at"] > b["created-at"]) {
          return -1;
        }

        if (a["created-at"] < b["created-at"]) {
          return 1;
        }

        return 0;
      });
    },
    enabled: !!brandId,
  });
};

export default useRemodels;
