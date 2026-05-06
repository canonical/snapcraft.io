import { useQuery, UseQueryResult } from "react-query";
import type { SerialLogResponse, ApiResponse } from "../types/shared";

const useSerialLogs = (
  brandId: string | undefined,
  modelId: string | undefined,
  urlSearchParams?: {
    page?: string | null;
    pageSize?: number;
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
    const { interval, pageSize, page } = urlSearchParams;

    if (interval) {
      url.searchParams.set("start-time", interval.startTime);
      url.searchParams.set("end-time", interval.endTime);
    }

    if (pageSize) {
      url.searchParams.set("page-size", pageSize.toString());
    }

    if (page) {
      url.searchParams.set("page", page);
    }
  }

  return useQuery<ApiResponse<SerialLogResponse>, Error>({
    queryKey: [
      "serials",
      brandId,
      modelId,
      urlSearchParams?.page,
      urlSearchParams?.pageSize,
      urlSearchParams?.interval,
    ],
    queryFn: async () => {
      const response = await fetch(url);
      const responseData = await response.json();

      return responseData;
    },
    enabled: !!brandId,
  });
};

export default useSerialLogs;
