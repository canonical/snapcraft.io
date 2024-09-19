import { useQuery } from "react-query";

function useActiveDeviceMetrics({
  snapId,
  period,
  type,
}: {
  snapId: string | undefined;
  period: string;
  type: string;
}) {
  return useQuery({
    queryKey: ["activeDeviceMetrics", snapId, period, type],
    queryFn: async () => {
      const response = await fetch(
        `/${snapId}/metrics/active-devices?period=${period}&active-devices=${type}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            latest_active_devices: 0,
            active_devices: [],
          };
        } else {
          throw new Error("Unable to fetch active device metrics");
        }
      }

      const data = await response.json();

      return data;
    },
    retry: 0,
  });
}

export default useActiveDeviceMetrics;
