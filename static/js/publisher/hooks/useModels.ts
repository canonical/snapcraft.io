import { useQuery, UseQueryResult } from "react-query";
import type { Model as ModelType } from "../types/shared";

const useModels = (
  brandId: string | undefined,
): UseQueryResult<ModelType[], Error> => {
  return useQuery<ModelType[], Error>({
    queryKey: ["models", brandId],
    queryFn: async () => {
      const response = await fetch(`/api/store/${brandId}/models`);

      if (!response.ok) {
        throw new Error("There was a problem fetching models");
      }

      const modelsData = await response.json();

      if (!modelsData.success) {
        throw new Error(modelsData.message);
      }

      return modelsData.data;
    },
    enabled: !!brandId,
  });
};

export default useModels;
