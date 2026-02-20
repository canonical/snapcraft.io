import { useQuery, UseQueryResult } from "react-query";
import type { Remodel } from "../types/shared";

const useRemodels = (
  brandId: string | undefined,
): UseQueryResult<Remodel[], Error> => {
  return useQuery<Remodel[], Error>({
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

      return remodelsData.data.allowlist.sort((a: Remodel, b: Remodel) => {
        if (a["created-at"] > b["created-at"]) {
          return -1;
        }

        return 1;
      });
    },
    enabled: !!brandId,
  });
};

export default useRemodels;
