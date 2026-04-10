import { useQuery, UseQueryResult } from "react-query";
import type { SerialLog } from "../types/shared";

const useSerialLog = (
  brandId: string | undefined,
  modelId: string | undefined,
  serial: string | undefined,
): UseQueryResult<SerialLog[], Error> => {
  return useQuery<SerialLog[], Error>({
    queryKey: ["serialLog", brandId, modelId, serial],
    queryFn: async () => {
      const response = await fetch(
        `/api/store/${brandId}/models/${modelId}/serial/${serial}/serial-log`,
      );

      if (!response.ok) {
        throw new Error("There was a problem fetching the serial log");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data;
    },
    enabled: !!brandId,
  });
};

export default useSerialLog;
