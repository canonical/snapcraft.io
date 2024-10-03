import { useQuery } from "react-query";

function useLatestActiveDevicesMetric(snapId?: string) {
  return useQuery({
    queryKey: ["latestActiveDevicesMetric", snapId],
    queryFn: async () => {
      const response = await fetch(`/${snapId}/metrics/active-latest-devices`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        } else {
          throw new Error("Unable to fetch latest active device information");
        }
      }

      const data = await response.json();
      const activeDevices = data.latest_active_devices;
      return String(activeDevices).replace(/(.)(?=(\d{3})+$)/g, "$1,");
    },
    retry: 0,
    refetchOnWindowFocus: false,
  });
}

export default useLatestActiveDevicesMetric;
