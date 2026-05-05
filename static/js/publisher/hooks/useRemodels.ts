import { useQuery, UseQueryResult } from "react-query";
import type { RemodelResponse, ApiResponse } from "../types/shared";

const useRemodels = (
  brandId: string | undefined,
  urlSearchParams?: {
    page?: string | null;
    pageSize?: number;
    fromModel?: string;
  },
): UseQueryResult<ApiResponse<RemodelResponse>, Error> => {
  const url = new URL(
    `/api/store/${brandId}/models/remodel-allowlist`,
    window.location.origin,
  );

  if (urlSearchParams) {
    const { page, pageSize, fromModel } = urlSearchParams;

    if (page) {
      url.searchParams.set("page", page);
    }

    if (pageSize) {
      url.searchParams.set("page-size", pageSize.toString());
    }

    if (fromModel) {
      url.searchParams.set("from-model", fromModel);
    }
  }

  return useQuery<ApiResponse<RemodelResponse>, Error>({
    queryKey: [
      "remodels",
      brandId,
      urlSearchParams?.page,
      urlSearchParams?.pageSize,
      urlSearchParams?.fromModel,
    ],
    queryFn: async () => {
      const response = await fetch(url);
      const responseData = await response.json();
      return responseData;
    },
    enabled: !!brandId,
  });
};

export default useRemodels;
