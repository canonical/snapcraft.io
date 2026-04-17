import { useQuery, UseQueryResult } from "react-query";
import type { SerialLogResponse, ApiResponse } from "../types/shared";

const useSerialLogs = (
  brandId: string | undefined,
  modelId: string | undefined,
): UseQueryResult<ApiResponse<SerialLogResponse>, Error> => {
  return useQuery<ApiResponse<SerialLogResponse>, Error>({
    queryKey: ["serials", brandId, modelId],
    queryFn: async () => {
      const response = await fetch(
        `/api/store/${brandId}/models/${modelId}/serial-log`,
      );
      const responseData = await response.json();

      return responseData;
    },
    enabled: !!brandId,
  });
};

export default useSerialLogs;
