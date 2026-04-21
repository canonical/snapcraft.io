import { useQuery, UseQueryResult } from "react-query";
import type { SerialLogResponse, ApiResponse } from "../types/shared";

const useSerialLogs = (
  brandId: string | undefined,
  modelId: string | undefined,
  urlSearchParams?: {
    pageSize?: number;
    nextPage?: string;
    interval?: {
      startTime: string;
      endTime: string;
    };
  },
): UseQueryResult<ApiResponse<SerialLogResponse>, Error> => {
  const url = new URL(
    `/api/store/${brandId}/models/${modelId}/serial-log`,
    window.location.origin,
  );

  if (urlSearchParams) {
    const { interval, pageSize, nextPage } = urlSearchParams;

    if (interval) {
      url.searchParams.set("start-time", interval.startTime);
      url.searchParams.set("end-time", interval.endTime);
    }

    if (pageSize) {
      url.searchParams.set("page-size", pageSize.toString());
    }

    if (nextPage) {
      url.searchParams.set("next-page", nextPage);
    }
  }

  return useQuery<ApiResponse<SerialLogResponse>, Error>({
    queryKey: ["serials", brandId, modelId, urlSearchParams],
    queryFn: async () => {
      const response = await fetch(url.toString());
      const responseData = await response.json();

      return responseData;
    },
    enabled: !!brandId,
  });
};

export default useSerialLogs;
