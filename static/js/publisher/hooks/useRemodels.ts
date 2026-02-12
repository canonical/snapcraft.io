import { useQuery, UseQueryResult } from "react-query";
import type { Remodel as RemodelType } from "../types/shared";

const useRemodels = (
  brandId: string | undefined,
): UseQueryResult<RemodelType[], Error> => {
  return useQuery<RemodelType[], Error>({
    queryKey: ["remodels", brandId],
    queryFn: async () => {
      const response = await fetch(
        `/api/store/${brandId}/models/remodel-allowlist`,
      );

      if (!response.ok) {
        throw new Error("There was a problem fetching remodels");
      }

      const remodelsData = await response.json();

      if (!remodelsData.success) {
        throw new Error(remodelsData.message);
      }

      return remodelsData.data.allowlist;
    },
    enabled: !!brandId,
  });
};

export default useRemodels;
